import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type AttendanceLogRow = {
  id: number;
  event_type: "IN" | "OUT" | "LEAVE" | "WFH";
  event_time: string;
  leave_category: string | null;
  event_label: string | null;
};

export type LeaveDateInput = {
  date: string;
  category: string;
  label?: string;
};

export type WfhDateInput = {
  date: string;
};

export type RecurringLeaveMode = "every" | "alternate";
export type AlternatePattern = "first-third" | "second-fourth";

export type RecurringLeaveRuleInput = {
  weekday: number;
  mode: RecurringLeaveMode;
  pattern?: AlternatePattern | null;
};

export type AttendanceSettingsPayload = {
  recurringRules: RecurringLeaveRuleInput[];
  leaveDates: LeaveDateInput[];
  wfhDates: WfhDateInput[];
};

const AUTO_RECURRING_PREFIX = "AUTO_WEEKLY_OFF:RULE:";
function getRangeStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function parseRecurringRule(label: string | null): RecurringLeaveRuleInput | null {
  if (!label?.startsWith(AUTO_RECURRING_PREFIX)) {
    return null;
  }

  const [, , weekdayPart = "", modePart = "", patternPart = ""] = label.split(":");
  const weekday = Number(weekdayPart);

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return null;
  }

  if (modePart === "every") {
    return {
      weekday,
      mode: "every",
      pattern: null,
    };
  }

  if (modePart === "alternate" && (patternPart === "first-third" || patternPart === "second-fourth")) {
    return {
      weekday,
      mode: "alternate",
      pattern: patternPart,
    };
  }

  return null;
}

export async function getAttendanceSettingsForUser(userId: string): Promise<AttendanceSettingsPayload> {
  const admin = createSupabaseAdminClient();
  const start = getRangeStart().toISOString();

  const { data, error } = await admin
    .from("attendance_logs")
    .select("id, event_type, event_time, leave_category, event_label")
    .eq("user_id", userId)
    .gte("event_time", start)
    .order("event_time", { ascending: true })
    .returns<AttendanceLogRow[]>();

  if (error) {
    throw error;
  }

  const recurringRules = new Map<number, RecurringLeaveRuleInput>();
  const leaveDates = new Map<string, LeaveDateInput>();
  const wfhDates = new Map<string, WfhDateInput>();

  for (const row of data ?? []) {
    const date = row.event_time.slice(0, 10);

    if (row.event_type === "LEAVE") {
      const recurringRule = parseRecurringRule(row.event_label);
      if (recurringRule) {
        if (!recurringRules.has(recurringRule.weekday)) {
          recurringRules.set(recurringRule.weekday, recurringRule);
        }
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
    recurringRules: [...recurringRules.values()].sort((left, right) => left.weekday - right.weekday),
    leaveDates: [...leaveDates.values()],
    wfhDates: [...wfhDates.values()],
  };
}
