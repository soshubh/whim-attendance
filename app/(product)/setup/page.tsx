import {
  isOnboardingComplete,
  type OfficeSettingsRecord,
  type ShortcutTokenRecord,
  requireAuthenticatedContext,
} from "@/lib/auth";
import { getEnv } from "@/lib/env";

import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  const { supabase, user, profile } = await requireAuthenticatedContext();

  const [{ data: officeSettings }, { data: shortcutToken }] = await Promise.all([
    supabase
      .from("office_settings")
      .select("office_name, office_address, office_lat, office_lng, radius_meters, timezone")
      .eq("user_id", user.id)
      .maybeSingle<OfficeSettingsRecord>(),
    supabase
      .from("shortcut_tokens")
      .select("token, is_active")
      .eq("user_id", user.id)
      .maybeSingle<ShortcutTokenRecord>(),
  ]);

  const onboardingComplete = isOnboardingComplete({
    profile,
    officeSettings,
    shortcutToken,
  });

  return (
    <main className="app-shell app-flow-shell">
      <section className="app-flow-grid">
        <div className="app-panel app-panel-sticky">
          <p className="app-eyebrow">Setup workspace</p>
          <h1 className="app-title">Configure your workspace and generate two shortcut links.</h1>
          <p className="app-copy">
            Save your basic workspace once, then use one arrival URL and one leave URL in your iPhone automations. The backend will read the event directly from the URL.
          </p>

          <div className="app-step-list">
            <div className="app-step-item">
              <strong>1. Workspace setup</strong>
              <span>Add your name, office name, and office address once.</span>
            </div>
            <div className="app-step-item">
              <strong>2. Arrival automation</strong>
              <span>Copy the IN URL and use it in the office arrival automation with a POST request.</span>
            </div>
            <div className="app-step-item">
              <strong>3. Leave automation</strong>
              <span>Copy the OUT URL and use it in the office leave automation with a POST request.</span>
            </div>
          </div>

          {shortcutToken ? (
            <div className="app-shortcut-box">
              <span className="app-eyebrow">Office arrival URL</span>
              <code>{`${getEnv().appUrl}/api/shortcut/log?token=${shortcutToken.token}&event=IN`}</code>
              <span className="app-eyebrow">Office leave URL</span>
              <code>{getEnv().appUrl + "/api/shortcut/log?token=" + shortcutToken.token + "&event=OUT"}</code>
            </div>
          ) : null}

          {onboardingComplete ? (
            <div className="app-inline-actions">
              <a className="app-button app-button-primary" href="/dashboard">
                Open dashboard
              </a>
            </div>
          ) : null}
        </div>

        <SetupForm
          fullName={profile?.full_name ?? ""}
          officeSettings={officeSettings}
          shortcutToken={shortcutToken?.token ?? null}
        />
      </section>
    </main>
  );
}
