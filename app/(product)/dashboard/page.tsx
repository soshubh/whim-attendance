import { redirect } from "next/navigation";

import { getAttendanceSettingsForUser } from "@/lib/attendance-settings";
import {
  isOnboardingComplete,
  type ShortcutTokenRecord,
  requireAuthenticatedContext,
} from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { AttendanceDashboard, type DashboardAttendanceLog } from "./attendance-dashboard";

const INITIAL_MONTH_WINDOW = {
  before: 6,
  after: 6,
};

function getMonthWindowRange(date: Date, before: number, after: number) {
  return {
    start: new Date(date.getFullYear(), date.getMonth() - before, 1).toISOString(),
    end: new Date(date.getFullYear(), date.getMonth() + after + 1, 1).toISOString(),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireAuthenticatedContext();
  const now = new Date();

  const { start, end } = getMonthWindowRange(
    now,
    INITIAL_MONTH_WINDOW.before,
    INITIAL_MONTH_WINDOW.after,
  );

  const [{ data: shortcutToken }, { data: monthlyLogs }, settings] =
    await Promise.all([
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
        .order("event_time", { ascending: true })
        .returns<DashboardAttendanceLog[]>(),
      getAttendanceSettingsForUser(user.id),
    ]);

  if (
    !isOnboardingComplete({
      profile,
      shortcutToken,
    })
  ) {
    redirect("/setup");
  }

  const initialMonthKey = getMonthKey(now);
  const initialMonthCache: Record<string, DashboardAttendanceLog[]> = {};
  const shortcutTokenValue = shortcutToken?.token ?? "";
  const arrivalUrl = `${getEnv().appUrl}/api/shortcut/log?token=${shortcutTokenValue}&event=IN`;
  const leaveUrl = `${getEnv().appUrl}/api/shortcut/log?token=${shortcutTokenValue}&event=OUT`;

  for (let offset = -INITIAL_MONTH_WINDOW.before; offset <= INITIAL_MONTH_WINDOW.after; offset += 1) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    initialMonthCache[getMonthKey(targetDate)] = [];
  }

  for (const log of monthlyLogs ?? []) {
    const logMonthKey = log.event_time.slice(0, 7);
    const bucket = initialMonthCache[logMonthKey] ?? [];
    bucket.push(log);
    initialMonthCache[logMonthKey] = bucket;
  }

  return (
    <main className="app-shell app-dashboard-shell">
      <AttendanceDashboard
        initialLogs={initialMonthCache[initialMonthKey] ?? []}
        initialMonthCache={initialMonthCache}
        initialMonthKey={initialMonthKey}
        todayKey={getDateKey(now)}
        userId={user.id}
        fullName={profile?.full_name ?? null}
        email={user.email ?? null}
        initialSettings={settings}
        arrivalUrl={arrivalUrl}
        leaveUrl={leaveUrl}
      />
    </main>
  );
}
