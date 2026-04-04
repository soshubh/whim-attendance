import { redirect } from "next/navigation";

import {
  isOnboardingComplete,
  type OfficeSettingsRecord,
  type ShortcutTokenRecord,
  requireAuthenticatedContext,
} from "@/lib/auth";
import { getEnv } from "@/lib/env";

import { DashboardLiveRefresh } from "./dashboard-live-refresh";

type AttendanceLog = {
  id: number;
  event_type: "IN" | "OUT" | "LEAVE" | "WFH";
  event_time: string;
  leave_category: string | null;
  event_label: string | null;
};

function getMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
  };
}

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireAuthenticatedContext();

  const { start, end } = getMonthRange();

  const [{ data: officeSettings }, { data: shortcutToken }, { data: monthlyLogs }, { data: recentLogs }] =
    await Promise.all([
      supabase
        .from("office_settings")
        .select("office_name, office_address")
        .eq("user_id", user.id)
        .maybeSingle<Pick<OfficeSettingsRecord, "office_name" | "office_address">>(),
      supabase
        .from("shortcut_tokens")
        .select("token, is_active")
        .eq("user_id", user.id)
        .maybeSingle<ShortcutTokenRecord>(),
      supabase
        .from("attendance_logs")
        .select("id, event_type, event_time, leave_category, event_label")
        .eq("user_id", user.id)
        .gte("event_time", start)
        .lt("event_time", end)
        .order("event_time", { ascending: false })
        .returns<AttendanceLog[]>(),
      supabase
        .from("attendance_logs")
        .select("id, event_type, event_time, leave_category, event_label")
        .eq("user_id", user.id)
        .order("event_time", { ascending: false })
        .limit(8)
        .returns<AttendanceLog[]>(),
    ]);

  if (
    !isOnboardingComplete({
      profile,
      officeSettings: officeSettings as OfficeSettingsRecord | null,
      shortcutToken,
    })
  ) {
    redirect("/setup");
  }

  const metrics = {
    monthlyIn: monthlyLogs?.filter((item) => item.event_type === "IN").length ?? 0,
    monthlyOut: monthlyLogs?.filter((item) => item.event_type === "OUT").length ?? 0,
    monthlyLeave: monthlyLogs?.filter((item) => item.event_type === "LEAVE").length ?? 0,
    monthlyWfh: monthlyLogs?.filter((item) => item.event_type === "WFH").length ?? 0,
  };

  return (
    <main className="app-shell app-dashboard-shell">
      <DashboardLiveRefresh userId={user.id} />
      <section className="app-dashboard-topbar">
        <div>
          <p className="app-eyebrow">Attendance workspace</p>
          <h1 className="app-title">Welcome, {profile?.full_name ?? user.email}.</h1>
          <p className="app-copy">
            Your workspace and shortcut links are active. Each automation will log into this dashboard only.
          </p>
        </div>
        <div className="app-inline-actions">
          <a className="app-button app-button-secondary" href="/setup">
            Edit setup
          </a>
          <a className="app-button app-button-primary" href="/logout">
            Log out
          </a>
        </div>
      </section>

      <section className="app-stat-grid">
        <article className="app-stat-card">
          <span>This month IN</span>
          <strong>{metrics.monthlyIn}</strong>
        </article>
        <article className="app-stat-card">
          <span>This month OUT</span>
          <strong>{metrics.monthlyOut}</strong>
        </article>
        <article className="app-stat-card">
          <span>Leave events</span>
          <strong>{metrics.monthlyLeave}</strong>
        </article>
        <article className="app-stat-card">
          <span>WFH events</span>
          <strong>{metrics.monthlyWfh}</strong>
        </article>
      </section>

      <section className="app-dashboard-grid">
        <article className="app-panel">
          <div className="app-panel-heading">
            <p className="app-eyebrow">Shortcut setup</p>
            <h2 className="app-subtitle">Use one fixed URL for arrival and one fixed URL for leave.</h2>
          </div>

          <div className="app-shortcut-box">
            <span className="app-label">Office arrival URL</span>
            <code>{`${getEnv().appUrl}/api/shortcut/log?token=${shortcutToken?.token}&event=IN`}</code>
            <span className="app-label">Office leave URL</span>
            <code>{`${getEnv().appUrl}/api/shortcut/log?token=${shortcutToken?.token}&event=OUT`}</code>
          </div>

          <div className="app-step-list">
            <div className="app-step-item">
              <strong>Arrival automation</strong>
              <span>Use the IN URL in Get Contents of URL with POST. No headers and no JSON body are required.</span>
            </div>
            <div className="app-step-item">
              <strong>Leave automation</strong>
              <span>Use the OUT URL in Get Contents of URL with POST. No headers and no JSON body are required.</span>
            </div>
          </div>
        </article>

        <article className="app-panel">
          <div className="app-panel-heading">
            <p className="app-eyebrow">Workspace details</p>
            <h2 className="app-subtitle">These values describe this workspace and can be updated anytime.</h2>
          </div>

          <div className="app-data-list">
            <div className="app-data-row">
              <span>Name</span>
              <strong>{officeSettings?.office_name}</strong>
            </div>
            <div className="app-data-row">
              <span>Address</span>
              <strong>{officeSettings?.office_address}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="app-panel">
        <div className="app-panel-heading">
          <p className="app-eyebrow">Recent activity</p>
          <h2 className="app-subtitle">Latest attendance events for this workspace.</h2>
        </div>

        <div className="app-list">
          {(recentLogs ?? []).length ? (
            recentLogs?.map((log) => (
              <div className="app-list-item" key={log.id}>
                <div>
                  <strong>{log.event_type}</strong>
                  <p>
                    {new Date(log.event_time).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <span>
                  {log.leave_category || log.event_label || "Attendance event"}
                </span>
              </div>
            ))
          ) : (
            <div className="app-empty-box">No attendance logs yet. Finish your shortcut setup and run one of the automation URLs to create the first attendance event.</div>
          )}
        </div>
      </section>
    </main>
  );
}
