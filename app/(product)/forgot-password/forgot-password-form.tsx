"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function getForgotPasswordErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("too many requests")) {
    return "Too many reset attempts. Wait a moment and try again.";
  }

  return "We could not send the reset email right now. Please try again.";
}

export function ForgotPasswordForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const redirectTo = `${appUrl}/auth/callback?next=/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      setError(getForgotPasswordErrorMessage(resetError.message));
      setSubmitting(false);
      return;
    }

    setSuccess("If an account exists for this email, a reset link has been sent.");
    setSubmitting(false);
  }

  return (
    <main className="app-shell app-auth-shell">
      <section className="app-auth-card">
        <div className="app-auth-copy">
          <p className="app-eyebrow">Reset access</p>
          <h1 className="app-title">Send a password reset link.</h1>
          <p className="app-copy">
            Enter the email you used for your attendance workspace and we will send the next steps.
          </p>
        </div>

        {success ? <div className="app-success">{success}</div> : null}
        {error ? <div className="app-error">{error}</div> : null}

        <form className="app-form" onSubmit={handleSubmit}>
          <label className="app-field">
            <span>Email</span>
            <input
              className="app-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <button className="app-button app-button-primary" type="submit" disabled={submitting}>
            {submitting ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>

        <div className="app-inline-links">
          <Link href="/login">Back to login</Link>
        </div>
      </section>
    </main>
  );
}
