"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function getLoginErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid_credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "Incorrect email or password.";
  }

  if (normalized.includes("email not confirmed") || normalized.includes("email not verified")) {
    return "Please verify your email before logging in.";
  }

  if (normalized.includes("too many requests")) {
    return "Too many login attempts. Wait a moment and try again.";
  }

  return "We could not log you in right now. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const successMessage = searchParams.get("message");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(getLoginErrorMessage(signInError.message));
      setSubmitting(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="app-shell app-auth-shell">
      <section className="app-auth-card">
        <div className="app-auth-copy">
          <p className="app-eyebrow">Welcome back</p>
          <h1 className="app-title">Log in to your attendance workspace.</h1>
          <p className="app-copy">
            Use the same account you used to create your workspace and shortcut URLs.
          </p>
        </div>

        {successMessage ? <div className="app-success">{successMessage}</div> : null}
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

          <label className="app-field">
            <span>Password</span>
            <input
              className="app-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button className="app-button app-button-primary" type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="app-inline-links">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/signup">Create account</Link>
        </div>
      </section>
    </main>
  );
}
