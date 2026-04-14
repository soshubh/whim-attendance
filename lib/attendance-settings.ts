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

const AUTO_RECURRING_PREFIX = "AUTO_WEEKLY_OFF:RULE:";
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
      weeks: [1, 2, 3, 4, 5],
    };
  }

  if (modePart === "alternate" && patternPart === "first-third") {
    return {
      weekday,
      weeks: [1, 3],
    };
  }

  if (modePart === "alternate" && patternPart === "second-fourth") {
    return {
      weekday,
      weeks: [2, 4],
    };
  }

  if (modePart === "weeks") {
    const weeks = patternPart
      .split(",")
      .map((value) => Number(value))
      .filter((value): value is RecurringLeaveWeek => Number.isInteger(value) && value >= 1 && value <= 5);

    if (weeks.length > 0) {
      return {
        weekday,
        weeks: [...new Set(weeks)].sort((left, right) => left - right) as RecurringLeaveWeek[],
      };
    }
  }

  return null;
}

export async function getAttendanceSettingsForUser(userId: string): Promise<AttendanceSettingsPayload> {
  const admin = createSupabaseAdminClient();
  const start = getRangeStart().toISOString();
  const end = getRangeEnd().toISOString();

  const { data, error } = await admin
    .from("attendance_logs")
    .select("id, event_type, event_time, leave_category, event_label")
    .eq("user_id", userId)
    .gte("event_time", start)
    .lt("event_time", end)
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
