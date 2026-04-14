"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SetupFormProps = {
  showActions?: boolean;
};

export function SetupForm({ showActions = true }: SetupFormProps) {
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
      {error ? <div className="app-error">{error}</div> : null}
      {showActions ? (
        <>
          <button className="app-button app-button-primary" type="button" disabled={submitting} onClick={handleComplete}>
            {submitting ? "Opening dashboard..." : "Open dashboard"}
          </button>
          <div className="app-inline-actions">
            <a className="app-button app-button-secondary" href="/logout">
              Log out
            </a>
          </div>
        </>
      ) : null}
    </>
  );
}
