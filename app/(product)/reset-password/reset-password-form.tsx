"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function getResetPasswordErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("same password")) {
    return "Choose a different password from your current one.";
  }

  if (normalized.includes("least") && normalized.includes("password")) {
    return "Use a stronger password with at least 8 characters.";
  }

  if (normalized.includes("expired") || normalized.includes("invalid") || normalized.includes("session")) {
    return "This reset link is no longer valid. Request a new password reset email.";
  }

  return "We could not update your password right now. Please try again.";
}

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(getResetPasswordErrorMessage(updateError.message));
      setSubmitting(false);
      return;
    }

    setSuccess("Password updated. Redirecting to your dashboard...");
    setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 1200);
  }

  return (
    <main className="app-shell app-auth-shell">
      <section className="app-auth-card">
        <div className="app-auth-copy">
          <p className="app-eyebrow">Choose a new password</p>
          <h1 className="app-title">Reset your account password.</h1>
          <p className="app-copy">
            Open this page from the email link, then set a new password for your attendance workspace.
          </p>
        </div>

        {success ? <div className="app-success">{success}</div> : null}
        {error ? <div className="app-error">{error}</div> : null}

        <form className="app-form" onSubmit={handleSubmit}>
          <label className="app-field">
            <span>New password</span>
            <input
              className="app-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <label className="app-field">
            <span>Confirm password</span>
            <input
              className="app-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <button className="app-button app-button-primary" type="submit" disabled={submitting}>
            {submitting ? "Updating password..." : "Update password"}
          </button>
        </form>

        <div className="app-inline-links">
          <Link href="/login">Back to login</Link>
        </div>
      </section>
    </main>
  );
}
