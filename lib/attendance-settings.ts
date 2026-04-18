import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type AttendanceLogRow = {
  id: number;
  event_type: "IN" | "OUT" | "LEAVE" | "WFH";
  event_time: string;
  leave_category: string | null;
  event_label: string | null;
};

type OfficeSettingsRow = {
  weekly_off_rules: unknown;
};

export type LeaveDateInput = {
  date: string;
  category: string;
  label?: string;
};

export type WfhDateInput = {
  date: string;
};

export type RecurringLeaveWeek = 1 | 2 | 3 | 4 | 5;

export type RecurringLeaveRuleInput = {
  weekday: number;
  weeks: RecurringLeaveWeek[];
};

export type AttendanceSettingsPayload = {
  recurringRules: RecurringLeaveRuleInput[];
  leaveDates: LeaveDateInput[];
  wfhDates: WfhDateInput[];
};

const RANGE_MONTHS_BACK = 24;
const RANGE_MONTHS_FORWARD = 24;

function getRangeStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - RANGE_MONTHS_BACK, 1);
}

function getRangeEnd() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + RANGE_MONTHS_FORWARD + 1, 1);
}

function normalizeRecurringRules(value: unknown): RecurringLeaveRuleInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is RecurringLeaveRuleInput => {
      if (!item || typeof item !== "object") return false;

      const record = item as Record<string, unknown>;
      const weekday = record.weekday;
      const weeks = record.weeks;

      if (
        typeof weekday !== "number" ||
        !Number.isInteger(weekday) ||
        weekday < 0 ||
        weekday > 6
      ) {
        return false;
      }

      if (!Array.isArray(weeks) || weeks.length === 0) {
        return false;
      }

      return weeks.every(
        (week) =>
          typeof week === "number" &&
          Number.isInteger(week) &&
          week >= 1 &&
          week <= 5,
      );
    })
    .map((item) => ({
      weekday: item.weekday,
      weeks: [...new Set(item.weeks)].sort((left, right) => left - right) as RecurringLeaveWeek[],
    }))
    .sort((left, right) => left.weekday - right.weekday)
    .filter(
      (rule, index, rules) =>
        index === rules.findIndex((candidate) => candidate.weekday === rule.weekday),
    );
}

export async function getAttendanceSettingsForUser(userId: string): Promise<AttendanceSettingsPayload> {
  const admin = createSupabaseAdminClient();
  const start = getRangeStart().toISOString();
  const end = getRangeEnd().toISOString();

  const [
    { data, error },
    { data: officeSettings, error: officeSettingsError },
  ] = await Promise.all([
    admin
      .from("attendance_logs")
      .select("id, event_type, event_time, leave_category, event_label")
      .eq("user_id", userId)
      .gte("event_time", start)
      .lt("event_time", end)
      .order("event_time", { ascending: true })
      .returns<AttendanceLogRow[]>(),
    admin
      .from("office_settings")
      .select("weekly_off_rules")
      .eq("user_id", userId)
      .maybeSingle<OfficeSettingsRow>(),
  ]);

  if (error) {
    throw error;
  }

  if (officeSettingsError) {
    throw officeSettingsError;
  }

  const leaveDates = new Map<string, LeaveDateInput>();
  const wfhDates = new Map<string, WfhDateInput>();

  for (const row of data ?? []) {
    const date = row.event_time.slice(0, 10);

    if (row.event_type === "LEAVE") {
      if (row.leave_category === "Weekly Off" && row.event_label?.startsWith("AUTO_WEEKLY_OFF:")) {
        continue;
      }

      if (!leaveDates.has(date)) {
        leaveDates.set(date, {
          date,
          category: row.leave_category || "Earned Leave",
          label: row.event_label || "",
        });
      }
    }

    if (row.event_type === "WFH" && !wfhDates.has(date)) {
      wfhDates.set(date, { date });
    }
  }

  return {
    recurringRules: normalizeRecurringRules(officeSettings?.weekly_off_rules),
    leaveDates: [...leaveDates.values()],
    wfhDates: [...wfhDates.values()],
  };
}
