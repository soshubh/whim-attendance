"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ArrowRightIcon } from "../components/email-otp-auth-form";

type SetupFormProps = {
  showActions?: boolean;
  revealActions?: boolean;
  mode?: "default" | "topbar";
};

export function SetupForm({
  showActions = true,
  revealActions = true,
  mode = "default",
}: SetupFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleComplete() {
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/setup/complete", {
      method: "POST",
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Could not complete setup.");
      setSubmitting(false);
      return;
    }

    router.replace("/attendance");
  }

  return (
    <>
      {error ? (
        <div className={mode === "topbar" ? "app-setup-top-error" : "app-error"}>
          {error}
        </div>
      ) : null}
      {showActions ? (
        <div
          className={`app-setup-actions${revealActions ? " is-revealed" : ""}${mode === "topbar" ? " is-topbar" : ""}`}
        >
          <button
            className={mode === "topbar"
              ? "app-dashboard-settings-trigger app-setup-forward-trigger"
              : "app-button app-button-primary app-setup-forward-button"}
            type="button"
            disabled={submitting}
            onClick={handleComplete}
            aria-label={submitting ? "Opening dashboard" : "Open dashboard"}
            title={submitting ? "Opening dashboard" : "Open dashboard"}
          >
            <span className={submitting ? "animate-pulse" : ""}>
              <ArrowRightIcon />
            </span>
          </button>
        </div>
      ) : null}
    </>
  );
}
