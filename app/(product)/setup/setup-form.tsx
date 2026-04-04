"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type OfficeSettings = {
  office_name: string | null;
  office_address: string | null;
} | null;

export function SetupForm({
  fullName,
  officeSettings,
}: {
  fullName: string;
  officeSettings: OfficeSettings;
  shortcutToken: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState({
    fullName,
    officeName: officeSettings?.office_name ?? "",
    officeAddress: officeSettings?.office_address ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      token?: string;
    };

    if (!response.ok) {
      setError(payload.error ?? "Could not save setup.");
      setSubmitting(false);
      return;
    }

    setSuccess("Setup saved. Redirecting to your dashboard...");

    setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 900);
  }

  return (
    <section className="app-panel app-panel-form">
      <div className="app-panel-heading">
        <p className="app-eyebrow">Workspace details</p>
        <h2 className="app-subtitle">Save the basic details your shortcut workspace will use.</h2>
      </div>

      {error ? <div className="app-error">{error}</div> : null}
      {success ? <div className="app-success">{success}</div> : null}

      <form className="app-form" onSubmit={handleSubmit}>
        <label className="app-field">
          <span>Full name</span>
          <input
            className="app-input"
            value={state.fullName}
            onChange={(event) => setState((current) => ({ ...current, fullName: event.target.value }))}
            required
          />
        </label>

        <label className="app-field">
          <span>Office name</span>
          <input
            className="app-input"
            value={state.officeName}
            onChange={(event) => setState((current) => ({ ...current, officeName: event.target.value }))}
            required
          />
        </label>

        <label className="app-field">
          <span>Office address</span>
          <input
            className="app-input"
            value={state.officeAddress}
            onChange={(event) => setState((current) => ({ ...current, officeAddress: event.target.value }))}
            required
          />
        </label>

        <button className="app-button app-button-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving setup..." : "Save setup and continue"}
        </button>
      </form>
    </section>
  );
}
