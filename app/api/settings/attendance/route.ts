import { NextResponse } from "next/server";

import { getAttendanceSettingsForUser } from "@/lib/attendance-settings";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type AttendanceLogRow = {
  id: number;
  event_type: "IN" | "OUT" | "LEAVE" | "WFH";
  event_time: string;
  leave_category: string | null;
  event_label: string | null;
};

type LeaveDateInput = {
  date: string;
  category: string;
  label?: string;
};

type WfhDateInput = {
  date: string;
};

type RecurringLeaveWeek = 1 | 2 | 3 | 4 | 5;

type RecurringLeaveRuleInput = {
  weekday: number;
  weeks: RecurringLeaveWeek[];
};

type SettingsBody = {
  recurringRules?: unknown[];
  leaveDates?: unknown[];
  wfhDates?: unknown[];
};

const AUTO_RECURRING_PREFIX = "AUTO_WEEKLY_OFF:RULE:";
const RANGE_MONTHS_BACK = 24;
const RANGE_MONTHS_FORWARD = 24;
const LEAVE_CATEGORIES = [
  "Weekly Off",
  "Earned Leave",
  "Casual Leave",
  "Sick Leave",
  "Compensatory Off",
  "Public Holidays",
  "Restricted Holidays",
  "Loss of Pay (LOP)",
] as const;

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRangeStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - RANGE_MONTHS_BACK, 1);
}

function getRangeEnd(start: Date) {
  return new Date(start.getFullYear(), start.getMonth() + RANGE_MONTHS_BACK + RANGE_MONTHS_FORWARD + 1, 1);
}

function getWeekdayOccurrenceInMonth(date: Date) {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

function getRecurringLabel(rule: RecurringLeaveRuleInput) {
  return `${AUTO_RECURRING_PREFIX}${rule.weekday}:weeks:${rule.weeks.join(",")}`;
}

function doesRuleMatchDate(date: Date, rule: RecurringLeaveRuleInput) {
  if (date.getDay() !== rule.weekday) {
    return false;
  }

  const weekdayOccurrence = getWeekdayOccurrenceInMonth(date);
  return rule.weeks.includes(weekdayOccurrence as RecurringLeaveWeek);
}

function getRecurringLeaveDates(rules: RecurringLeaveRuleInput[]) {
  const start = getRangeStart();
  const end = getRangeEnd(start);
  const dates = new Map<string, string>();

  for (let cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
    const date = new Date(cursor);
    const dateKey = toDateKey(date);

    for (const rule of rules) {
      if (doesRuleMatchDate(date, rule)) {
        dates.set(dateKey, getRecurringLabel(rule));
        break;
      }
    }
  }

  return dates;
}

function normalizeRecurringRules(value: unknown[]) {
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

function normalizeLeaveDates(value: unknown[]) {
  const seen = new Set<string>();

  return value
    .filter((item): item is LeaveDateInput => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return (
        typeof record.date === "string" &&
        isValidDateString(record.date) &&
        typeof record.category === "string" &&
        LEAVE_CATEGORIES.includes(record.category as (typeof LEAVE_CATEGORIES)[number]) &&
        (typeof record.label === "string" || typeof record.label === "undefined")
      );
    })
    .map((item) => ({
      date: item.date,
      category: item.category,
      label: item.label?.trim() ?? "",
    }))
    .filter((item) => {
      if (seen.has(item.date)) return false;
      seen.add(item.date);
      return true;
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

function normalizeWfhDates(value: unknown[]) {
  const seen = new Set<string>();

  return value
    .filter((item): item is WfhDateInput => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return typeof record.date === "string" && isValidDateString(record.date);
    })
    .map((item) => ({ date: item.date }))
    .filter((item) => {
      if (seen.has(item.date)) return false;
      seen.add(item.date);
      return true;
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

function isRecurringLabel(label: string | null) {
  return Boolean(
    label &&
      (label.startsWith(AUTO_RECURRING_PREFIX) ||
        label.startsWith("AUTO_WEEKLY_OFF:WEEKDAY:") ||
        label === "AUTO_WEEKLY_OFF:ALT_SAT"),
  );
}

async function getAuthenticatedUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getAttendanceSettingsForUser(userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SettingsBody | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const recurringRules = Array.isArray(body.recurringRules)
    ? normalizeRecurringRules(body.recurringRules)
    : [];
  const leaveDates = Array.isArray(body.leaveDates) ? normalizeLeaveDates(body.leaveDates) : [];
  const wfhDates = Array.isArray(body.wfhDates) ? normalizeWfhDates(body.wfhDates) : [];

  const overlap = leaveDates.find((leave) => wfhDates.some((wfh) => wfh.date === leave.date));
  if (overlap) {
    return NextResponse.json(
      { error: `Leave and WFH cannot use the same date (${overlap.date}).` },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const rangeStart = getRangeStart();
  const rangeEnd = getRangeEnd(rangeStart);

  const { data: existingRows, error: existingRowsError } = await admin
    .from("attendance_logs")
    .select("id, event_type, event_time, leave_category, event_label")
    .eq("user_id", userId)
    .gte("event_time", rangeStart.toISOString())
    .lt("event_time", rangeEnd.toISOString())
    .order("event_time", { ascending: true })
    .returns<AttendanceLogRow[]>();

  if (existingRowsError) {
    return NextResponse.json({ error: existingRowsError.message }, { status: 500 });
  }

  const recurringLeaveRows =
    existingRows?.filter(
      (row) =>
        row.event_type === "LEAVE" &&
        row.leave_category === "Weekly Off" &&
        (isRecurringLabel(row.event_label) || !row.event_label),
    ) ?? [];
  const explicitLeaveRows =
    existingRows?.filter(
      (row) => row.event_type === "LEAVE" && !isRecurringLabel(row.event_label),
    ) ?? [];
  const explicitWfhRows = existingRows?.filter((row) => row.event_type === "WFH") ?? [];
  const occupiedDates = new Set(
    (existingRows ?? [])
      .filter((row) => row.event_type === "IN" || row.event_type === "OUT")
      .map((row) => row.event_time.slice(0, 10)),
  );

  if (recurringLeaveRows.length > 0) {
    const { error } = await admin
      .from("attendance_logs")
      .delete()
      .in(
        "id",
        recurringLeaveRows.map((row) => row.id),
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const explicitLeaveByDate = new Map(
    explicitLeaveRows.map((row) => [
      row.event_time.slice(0, 10),
      row,
    ]),
  );
  const explicitWfhByDate = new Map(
    explicitWfhRows.map((row) => [
      row.event_time.slice(0, 10),
      row,
    ]),
  );

  const nextLeaveDateKeys = new Set(leaveDates.map((item) => item.date));
  const nextWfhDateKeys = new Set(wfhDates.map((item) => item.date));

  const leaveRowsToDelete = explicitLeaveRows.filter(
    (row) => !nextLeaveDateKeys.has(row.event_time.slice(0, 10)),
  );
  const wfhRowsToDelete = explicitWfhRows.filter(
    (row) => !nextWfhDateKeys.has(row.event_time.slice(0, 10)),
  );

  if (leaveRowsToDelete.length > 0) {
    const { error } = await admin
      .from("attendance_logs")
      .delete()
      .in(
        "id",
        leaveRowsToDelete.map((row) => row.id),
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (wfhRowsToDelete.length > 0) {
    const { error } = await admin
      .from("attendance_logs")
      .delete()
      .in(
        "id",
        wfhRowsToDelete.map((row) => row.id),
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const leaveRowsToInsert = leaveDates.filter((item) => !explicitLeaveByDate.has(item.date));
  const leaveRowsToUpdate = leaveDates.filter((item) => {
    const existing = explicitLeaveByDate.get(item.date);
    return (
      existing &&
      (existing.leave_category !== item.category || (existing.event_label || "") !== item.label)
    );
  });

  const wfhRowsToInsert = wfhDates.filter((item) => !explicitWfhByDate.has(item.date));

  await Promise.all(
    leaveRowsToInsert.map((item) =>
      admin.from("attendance_logs").insert({
        user_id: userId,
        event_type: "LEAVE",
        event_time: `${item.date}T00:00:00`,
        leave_category: item.category,
        event_label: item.label || null,
      }),
    ),
  );

  await Promise.all(
    leaveRowsToUpdate.map((item) =>
      admin
        .from("attendance_logs")
        .update({
          leave_category: item.category,
          event_label: item.label || null,
        })
        .eq("id", explicitLeaveByDate.get(item.date)!.id),
    ),
  );

  await Promise.all(
    wfhRowsToInsert.map((item) =>
      admin.from("attendance_logs").insert({
        user_id: userId,
        event_type: "WFH",
        event_time: `${item.date}T00:00:00`,
      }),
    ),
  );

  const recurringDates = getRecurringLeaveDates(recurringRules);
  const leaveDateSet = new Set(leaveDates.map((item) => item.date));
  const wfhDateSet = new Set(wfhDates.map((item) => item.date));

  const recurringRows = [...recurringDates.entries()]
    .filter(([date]) => !occupiedDates.has(date) && !leaveDateSet.has(date) && !wfhDateSet.has(date))
    .map(([date, label]) => ({
      user_id: userId,
      event_type: "LEAVE" as const,
      event_time: `${date}T00:00:00`,
      leave_category: "Weekly Off",
      event_label: label,
    }));

  if (recurringRows.length > 0) {
    const { error } = await admin.from("attendance_logs").insert(recurringRows);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
