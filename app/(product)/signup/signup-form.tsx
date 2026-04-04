"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function getSignupErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("already been registered") || normalized.includes("user already registered")) {
    return "This email is already registered. Try logging in instead.";
  }

  if (normalized.includes("password") && normalized.includes("least")) {
    return "Use a stronger password with at least 8 characters.";
  }

  if (normalized.includes("invalid email")) {
    return "Enter a valid email address.";
  }

  return "We could not create your account right now. Please try again.";
}

export function SignupForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    const emailRedirectTo = `${appUrl}/auth/callback?next=/setup`;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo,
      },
    });

    if (signUpError) {
      setError(getSignupErrorMessage(signUpError.message));
      setSubmitting(false);
      return;
    }

    if (data.session) {
      router.replace("/setup");
      router.refresh();
      return;
    }

    setSuccess("Account created. Check your email to verify your account, then log in.");
    setSubmitting(false);
  }

  return (
    <main className="app-shell app-auth-shell">
      <section className="app-auth-card">
        <div className="app-auth-copy">
          <p className="app-eyebrow">Create your workspace</p>
          <h1 className="app-title">Set up a private attendance dashboard for your office.</h1>
          <p className="app-copy">
            After signup you will finish your workspace setup and copy your personal iPhone Shortcut URLs.
          </p>
        </div>

        {success ? <div className="app-success">{success}</div> : null}
        {error ? <div className="app-error">{error}</div> : null}

        <form className="app-form" onSubmit={handleSubmit}>
          <label className="app-field">
            <span>Full name</span>
            <input
              className="app-input"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>

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
              minLength={8}
              required
            />
          </label>

          <button className="app-button app-button-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="app-inline-links">
          <Link href="/login">Already have an account?</Link>
        </div>
      </section>
    </main>
  );
}
