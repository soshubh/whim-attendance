"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowReloadHorizontalIcon,
  ArrowRight01Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AuthFormShell } from "./auth-form-shell";

const OTP_LENGTH = 6;
const OTP_RESEND_COOLDOWN = 30;

type LinkItem = {
  href: string;
  label: string;
};

type EmailOtpAuthFormProps = {
  title: string;
  description: string;
  otpType: EmailOtpType;
  shouldCreateUser: boolean;
  redirectPath: string;
  flowLabel: string;
  googleRedirectPath?: string;
  googleLabel?: ReactNode;
  googleCtaMode?: "default" | "split";
  submitCtaMode?: "stacked" | "inline";
  hideEmailSubmitButton?: boolean;
  splitArrowAction?: "google" | "submit";
  emailLabel?: string;
  emailPlaceholder?: string;
  sendLabel?: ReactNode;
  verifyLabel?: ReactNode;
  links: LinkItem[];
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4a9.6 9.6 0 1 0 0 19.2c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.5H12Z"
      />
      <path
        fill="#34A853"
        d="M3.9 7.4 7.1 9.7C7.9 7.7 9.8 6 12 6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4c-3.7 0-6.9 2.1-8.5 5Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.6c2.7 0 5-.9 6.7-2.5l-3.1-2.5c-.8.6-1.9 1.1-3.6 1.1-3.9 0-5.3-2.6-5.5-3.9l-3.2 2.4c1.6 3 4.7 5.4 8.7 5.4Z"
      />
      <path
        fill="#4285F4"
        d="M3.3 16.2 6.5 13.8c-.2-.5-.3-1.1-.3-1.8s.1-1.3.3-1.8L3.3 7.8A9.5 9.5 0 0 0 2.4 12c0 1.5.4 2.9.9 4.2Z"
      />
    </svg>
  );
}

export function ArrowRightIcon() {
  return <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.2} className="size-5 shrink-0" />;
}

function ResendIcon({ className = "" }: { className?: string }) {
  return (
    <HugeiconsIcon
      icon={ArrowReloadHorizontalIcon}
      strokeWidth={2.1}
      className={`size-5 shrink-0 ${className}`}
    />
  );
}

function getRequestErrorMessage(
  message: string,
  shouldCreateUser: boolean,
  flowLabel: string,
) {
  const normalized = message.toLowerCase();

  if (normalized.includes("too many requests")) {
    return "Too many code requests. Wait a moment and try again.";
  }

  if (!shouldCreateUser && normalized.includes("signups not allowed")) {
    return "We could not find a WHIM account for that email.";
  }

  if (shouldCreateUser && normalized.includes("email address not authorized")) {
    return "This email cannot create a WHIM account right now.";
  }

  return `We could not send your ${flowLabel} code right now. Please try again.`;
}

function getVerifyErrorMessage(message: string, flowLabel: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("token has expired") ||
    normalized.includes("invalid otp") ||
    normalized.includes("expired") ||
    normalized.includes("invalid")
  ) {
    return `This ${flowLabel} code is invalid or expired. Request a new one and try again.`;
  }

  if (normalized.includes("too many requests")) {
    return `Too many ${flowLabel} attempts. Wait a moment and try again.`;
  }

  return `We could not verify your ${flowLabel} code right now. Please try again.`;
}

function normalizeOtpInput(value: string) {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function EmailOtpAuthForm({
  title,
  description,
  otpType,
  shouldCreateUser,
  redirectPath,
  flowLabel,
  googleRedirectPath,
  googleLabel = "Continue with Google",
  googleCtaMode = "default",
  submitCtaMode = "stacked",
  hideEmailSubmitButton = false,
  splitArrowAction = "google",
  emailLabel = "",
  emailPlaceholder = "Enter your email",
  sendLabel = "Send code",
  verifyLabel = "Verify code",
  links,
}: EmailOtpAuthFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [codeSentTo, setCodeSentTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [oauthing, setOauthing] = useState(false);
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fullName, setFullName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const isOtpStep = codeSentTo.length > 0;
  const isNameStep = needsName;
  const hasEmailInput = email.trim().length > 0;
  const hasOtpInput = token.trim().length > 0;
  const hasNameInput = fullName.trim().length > 0;
  const showInlineEmailSubmit = hasEmailInput && !oauthing && !submitting;

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [resendCooldown]);

  function resetToEmailStep() {
    setCodeSentTo("");
    setToken("");
    setFullName("");
    setNeedsName(false);
    setSuccess("");
    setResendCooldown(0);
  }

  function showAuthError(message: string) {
    toast.error(message, { id: "auth-error" });
  }

  async function requestCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      showAuthError("Enter your email first.");
      return;
    }

    setSubmitting(true);
    setCodeSentTo(normalizedEmail);
    setToken("");
    setSuccess(`Sending a one-time code to ${normalizedEmail}...`);
    setResendCooldown(OTP_RESEND_COOLDOWN);

    const { error: requestError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser,
      },
    });

    if (requestError) {
      showAuthError(getRequestErrorMessage(requestError.message, shouldCreateUser, flowLabel));
      setSuccess("");
      setResendCooldown(0);
      setSubmitting(false);
      return;
    }

    setSuccess("");
    setSubmitting(false);
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (token.length !== OTP_LENGTH) {
      showAuthError(`Enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }

    setVerifying(true);
    setSuccess("");

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: codeSentTo,
      token,
      type: otpType,
    });

    if (verifyError) {
      showAuthError(getVerifyErrorMessage(verifyError.message, flowLabel));
      setVerifying(false);
      return;
    }

    const stateResponse = await fetch("/api/get-access/state", {
      method: "GET",
      cache: "no-store",
    });

    const statePayload = (await stateResponse.json().catch(() => ({}))) as {
      next?: "name" | "setup" | "dashboard";
      error?: string;
    };

    if (!stateResponse.ok) {
      showAuthError(statePayload.error ?? "We could not continue your access flow.");
      setVerifying(false);
      return;
    }

    setVerifying(false);

    if (statePayload.next === "name") {
      setNeedsName(true);
      return;
    }

    router.replace(statePayload.next === "setup" ? "/setup" : redirectPath);
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = fullName.trim();

    if (!normalizedName) {
      showAuthError("Enter your full name first.");
      return;
    }

    setSavingName(true);

    const response = await fetch("/api/get-access/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName: normalizedName }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      showAuthError(payload.error ?? "We could not save your name.");
      setSavingName(false);
      return;
    }

    router.replace("/setup");
  }

  async function continueWithGoogle() {
    setOauthing(true);
    setSuccess("");

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", googleRedirectPath ?? redirectPath);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (oauthError) {
      showAuthError("We could not start Google sign-in right now. Please try again.");
      setOauthing(false);
    }
  }

  return (
    <AuthFormShell title={title} description={description}>
      {success && !isOtpStep ? <div className="app-success">{success}</div> : null}

      <div className="grid gap-[var(--foundation-space-20)]">
        {!isOtpStep ? (
          <>
            <form className="grid gap-[var(--foundation-space-20)]" onSubmit={requestCode}>
              <label className="grid gap-[var(--foundation-space-12)]">
                {emailLabel ? (
                  <span className="text-[length:var(--foundation-type-14)] font-medium text-[color:var(--foundation-neutral-700)]">
                    {emailLabel}
                  </span>
                ) : null}
                {submitCtaMode === "inline" && !hideEmailSubmitButton ? (
                  <div className="relative overflow-hidden rounded-[var(--foundation-radius-full)] border border-[color:var(--foundation-stroke-neutral)] bg-[color:var(--foundation-neutral-100)]">
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={emailPlaceholder}
                      className={`min-h-[var(--foundation-space-60)] rounded-[var(--foundation-radius-full)] border-transparent bg-transparent px-[var(--foundation-space-20)] text-[length:var(--foundation-type-16)] shadow-none transition-[padding] duration-300 ease-out focus-visible:border-transparent focus-visible:ring-0 md:text-[length:var(--foundation-type-16)] ${
                        showInlineEmailSubmit
                          ? "pr-[calc(var(--foundation-space-60)+var(--foundation-space-20))]"
                          : "pr-[var(--foundation-space-20)]"
                      }`}
                      required
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submitting || oauthing}
                      className={`absolute right-0 top-1/2 size-[var(--foundation-space-60)] rounded-[var(--foundation-radius-full)] border-[3px] border-white px-0 transition-all duration-300 ease-out ${
                        showInlineEmailSubmit
                          ? "-translate-y-1/2 scale-100 opacity-100"
                          : "-translate-y-1/2 translate-x-[calc(var(--foundation-space-12)+4px)] scale-90 opacity-0 pointer-events-none"
                      }`}
                      aria-label={typeof sendLabel === "string" ? sendLabel : `Send ${flowLabel} code`}
                    >
                      <span className={submitting ? "animate-pulse" : ""}>{sendLabel}</span>
                    </Button>
                  </div>
                ) : (
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={emailPlaceholder}
                    className="min-h-[56px] rounded-[var(--foundation-radius-16)] border-[color:var(--foundation-stroke-neutral)] bg-white/96 px-[var(--foundation-space-16)] text-[length:var(--foundation-type-16)] md:text-[length:var(--foundation-type-16)]"
                    required
                  />
                )}
              </label>

              {!hideEmailSubmitButton && submitCtaMode !== "inline" ? (
                <Button
                  type="submit"
                  variant="primary"
                  width="full"
                  disabled={submitting || oauthing}
                >
                  {submitting ? "Sending code..." : sendLabel}
                </Button>
              ) : null}
            </form>

            {googleRedirectPath ? (
              <>
                {googleCtaMode === "default" ? (
                  <>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-[var(--foundation-space-12)] text-[length:var(--foundation-type-14)] text-[color:var(--foundation-neutral-700)]">
                      <span className="h-px bg-[color:var(--foundation-stroke-neutral)]" />
                      <span>or</span>
                      <span className="h-px bg-[color:var(--foundation-stroke-neutral)]" />
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      width="full"
                      onClick={() => void continueWithGoogle()}
                      className="justify-center gap-[var(--foundation-space-12)]"
                      disabled={oauthing || submitting}
                    >
                      <GoogleIcon />
                      <span>{oauthing ? "Redirecting to Google..." : googleLabel}</span>
                    </Button>
                  </>
                ) : (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-[var(--foundation-space-12)]">
                    <Button
                      type="button"
                      variant="secondary"
                      width="full"
                      onClick={() => void continueWithGoogle()}
                      className="justify-start gap-[var(--foundation-space-12)]"
                      disabled={oauthing || submitting}
                    >
                      <GoogleIcon />
                      <span>{oauthing ? "Redirecting to Google..." : googleLabel}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      onClick={() =>
                        splitArrowAction === "submit"
                          ? void requestCode()
                          : void continueWithGoogle()
                      }
                      className="aspect-square w-[var(--foundation-space-40)] px-0"
                      disabled={oauthing || submitting}
                      aria-label={
                        splitArrowAction === "submit"
                          ? "Send account code"
                          : "Continue with Google"
                      }
                    >
                      <ArrowRightIcon />
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </>
        ) : isNameStep ? (
          <form className="grid gap-[var(--foundation-space-20)]" onSubmit={saveName}>
            <div className="grid gap-[var(--foundation-space-12)]">
              <p className="text-[length:var(--foundation-type-14)] leading-[1.6] text-[color:var(--foundation-neutral-700)]">
                Add your name once to finish access.
              </p>
              <div className="relative overflow-hidden rounded-[var(--foundation-radius-full)] border border-[color:var(--foundation-stroke-neutral)] bg-[color:var(--foundation-neutral-100)]">
                <Input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Enter your full name"
                  className={`min-h-[var(--foundation-space-60)] rounded-[var(--foundation-radius-full)] border-transparent bg-transparent px-[var(--foundation-space-20)] text-[length:var(--foundation-type-16)] shadow-none transition-[padding] duration-300 ease-out focus-visible:border-transparent focus-visible:ring-0 md:text-[length:var(--foundation-type-16)] ${
                    hasNameInput
                      ? "pr-[calc(var(--foundation-space-60)+var(--foundation-space-20))]"
                      : "pr-[var(--foundation-space-20)]"
                  }`}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={savingName}
                  className={`absolute right-0 top-1/2 size-[var(--foundation-space-60)] rounded-[var(--foundation-radius-full)] border-[3px] border-white px-0 transition-all duration-300 ease-out ${
                    hasNameInput
                      ? "-translate-y-1/2 scale-100 opacity-100"
                      : "-translate-y-1/2 translate-x-[calc(var(--foundation-space-12)+4px)] scale-90 opacity-0 pointer-events-none"
                  }`}
                  aria-label="Save your name"
                >
                  <span className={savingName ? "animate-pulse" : ""}>
                    <ArrowRightIcon />
                  </span>
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <form className="grid gap-[var(--foundation-space-24)]" onSubmit={verifyCode}>
            <div className="grid gap-[var(--foundation-space-12)]">
              <div className="flex items-center gap-[var(--foundation-space-8)] text-[length:var(--foundation-type-16)] leading-[1.5] text-[color:var(--foundation-neutral-700)]">
                <p>
                  Enter the code sent to{" "}
                  <span className="font-medium text-[color:var(--foundation-color-text)]">
                    {codeSentTo}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={resetToEmailStep}
                  disabled={verifying || submitting}
                  className="inline-flex size-[var(--foundation-space-24)] shrink-0 items-center justify-center rounded-[var(--foundation-radius-full)] text-[color:var(--foundation-neutral-700)] transition-colors hover:text-[color:var(--foundation-color-text-inverse)] disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Edit email"
                >
                  <HugeiconsIcon icon={Edit02Icon} strokeWidth={2.1} className="size-4 shrink-0" />
                </button>
              </div>
              <div className="relative overflow-hidden rounded-[var(--foundation-radius-full)] border border-[color:var(--foundation-stroke-neutral)] bg-[color:var(--foundation-neutral-100)]">
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={token}
                  onChange={(event) => setToken(normalizeOtpInput(event.target.value))}
                  placeholder="Enter 6-digit code"
                  className={`min-h-[var(--foundation-space-60)] rounded-[var(--foundation-radius-full)] border-transparent bg-transparent px-[var(--foundation-space-20)] text-[length:var(--foundation-type-16)] shadow-none transition-[padding] duration-300 ease-out focus-visible:border-transparent focus-visible:ring-0 md:text-[length:var(--foundation-type-16)] ${
                    hasOtpInput
                      ? "pr-[calc((var(--foundation-space-60)*2)+var(--foundation-space-20))]"
                      : "pr-[var(--foundation-space-20)]"
                  }`}
                  maxLength={OTP_LENGTH}
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void requestCode()}
                  disabled={submitting || verifying || resendCooldown > 0}
                  className={`absolute top-1/2 size-[var(--foundation-space-60)] rounded-[var(--foundation-radius-full)] border-[3px] border-white px-0 transition-all duration-300 ease-out ${
                    hasOtpInput
                      ? "right-[var(--foundation-space-60)] -translate-y-1/2 scale-100 opacity-100"
                      : "right-0 -translate-y-1/2 scale-100 opacity-100"
                  }`}
                  aria-label="Resend code"
                >
                  {resendCooldown > 0 ? (
                    <span className="text-[length:var(--foundation-type-12)] font-medium tabular-nums text-[color:var(--foundation-neutral-700)]">
                      {resendCooldown}s
                    </span>
                  ) : (
                    <ResendIcon />
                  )}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={verifying || submitting}
                  className={`absolute right-0 top-1/2 z-10 size-[var(--foundation-space-60)] rounded-[var(--foundation-radius-full)] border-[3px] border-white px-0 transition-all duration-300 ease-out ${
                    hasOtpInput
                      ? "-translate-y-1/2 scale-100 opacity-100"
                      : "-translate-y-1/2 translate-x-full scale-90 opacity-0 pointer-events-none"
                  }`}
                  aria-label={typeof verifyLabel === "string" ? verifyLabel : `Verify ${flowLabel} code`}
                >
                  <span className={verifying ? "animate-pulse" : ""}>
                    <ArrowRightIcon />
                  </span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      {links.length ? (
        <div
          className={`flex flex-wrap pt-1 ${
            links.length === 2
              ? "w-full items-center justify-between gap-[var(--foundation-space-16)]"
              : "gap-[var(--foundation-space-16)]"
          }`}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[length:var(--foundation-type-14)] text-[color:var(--foundation-neutral-700)] no-underline transition-colors hover:text-[color:var(--foundation-color-text-inverse)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </AuthFormShell>
  );
}
