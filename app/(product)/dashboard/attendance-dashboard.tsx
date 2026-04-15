"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import type { AttendanceSettingsPayload } from "@/lib/attendance-settings";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { SettingsForm } from "@/app/(product)/settings/settings-form";
import { SetupPanelContent } from "@/app/(product)/setup/setup-panel-content";
import type {
  AddRecordInput,
  CalendarBadge,
  CalendarCell,
  DashboardAttendanceLog,
  DashboardListEntry,
  DashboardPanelType,
  DashboardStatSummary,
  SelectedDateDetail,
} from "./dashboard-shared";
import { DashboardLeftPanel } from "./components/dashboard-left-panel";
import { DashboardMiddlePanel } from "./components/dashboard-middle-panel";
import { DashboardRightPanel } from "./components/dashboard-right-panel";
import { DashboardTopPanel } from "./components/dashboard-top-panel";

export type { DashboardAttendanceLog } from "./dashboard-shared";

type QuickActionType = "leave" | "wfh";
type LeaveCategory =
  | "Earned Leave"
  | "Casual Leave"
  | "Sick Leave"
  | "Compensatory Off"
  | "Public Holidays"
  | "Restricted Holidays"
  | "Loss of Pay (LOP)";

type RecurringLeaveRule = {
  weekday: number;
  weeks: Array<1 | 2 | 3 | 4 | 5>;
};

type LeaveDateInput = {
  date: string;
  category: LeaveCategory;
  label: string;
};

type WfhDateInput = {
  date: string;
};

type AttendanceDashboardProps = {
  initialLogs: DashboardAttendanceLog[];
  initialMonthCache?: Record<string, DashboardAttendanceLog[]>;
  initialMonthKey: string;
  todayKey: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  initialSettings: AttendanceSettingsPayload;
  arrivalUrl: string;
  leaveUrl: string;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const APP_TIMEZONE = "Asia/Kolkata";
const RIGHT_PANEL_TRANSITION_MS = 280;
const RIGHT_PANEL_ENTER_DELAY_MS = 24;
const LEAVE_CATEGORIES: LeaveCategory[] = [
  "Earned Leave",
  "Casual Leave",
  "Sick Leave",
  "Compensatory Off",
  "Public Holidays",
  "Restricted Holidays",
  "Loss of Pay (LOP)",
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getDateKeyFromTimestamp(timestamp: string) {
  return timestamp.slice(0, 10);
}

function getDateFromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDisplayDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  }).format(getDisplayDate(year, month, 1));
}

function getNextMonthKey(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  return getMonthKey(next);
}

function getShortDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: APP_TIMEZONE,
  }).format(getDisplayDate(year, month, day));
}

function getLongDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  }).format(getDisplayDate(year, month, day));
}

function getTimeLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: APP_TIMEZONE,
  })
    .format(new Date(timestamp))
    .replace(/\s/g, "");
}

function getFirstName(fullName: string | null, email: string | null) {
  const trimmedName = fullName?.trim();

  if (trimmedName) {
    return trimmedName.split(/\s+/)[0] ?? trimmedName;
  }

  if (email) {
    return email.split("@")[0] ?? "User";
  }

  return "User";
}

function getUserInitial(fullName: string | null, email: string | null) {
  const firstName = getFirstName(fullName, email).trim();
  return firstName.charAt(0).toUpperCase() || "U";
}

function isWeeklyOffLog(log: DashboardAttendanceLog) {
  return log.event_type === "LEAVE" && log.leave_category === "Weekly Off";
}

function isAutoWeeklyOffLog(log: DashboardAttendanceLog) {
  return (
    isWeeklyOffLog(log) &&
    (!log.event_label || log.event_label.startsWith("AUTO_WEEKLY_OFF:"))
  );
}

function getWeekdayOccurrenceInMonth(date: Date) {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

function doesRecurringRuleMatchDate(dateKey: string, rule: RecurringLeaveRule) {
  const date = getDateFromDateKey(dateKey);

  if (date.getDay() !== rule.weekday) {
    return false;
  }

  const weekdayOccurrence = getWeekdayOccurrenceInMonth(date);
  return rule.weeks.includes(weekdayOccurrence as RecurringLeaveRule["weeks"][number]);
}

function getPresentEntry(log: DashboardAttendanceLog) {
  if (log.event_type === "IN") {
    return {
      tone: "present-in" as const,
      title: "Check-in",
      meta: getTimeLabel(log.event_time),
    };
  }

  return {
    tone: "present-out" as const,
    title: "Check-out",
    meta: getTimeLabel(log.event_time),
  };
}

function getSelectedDateEntry(log: DashboardAttendanceLog) {
  if (log.event_type === "IN" || log.event_type === "OUT") {
    return getPresentEntry(log);
  }

  if (log.event_type === "WFH") {
    return {
      tone: "wfh" as const,
      title: "WFH",
      meta: "Work from home recorded",
    };
  }

  if (isWeeklyOffLog(log)) {
    return {
      tone: "weekoff" as const,
      title: "Leave",
      meta: log.event_label && !log.event_label.startsWith("AUTO_") ? log.event_label : "Weekly Off",
    };
  }

  const cleanLeaveLabel =
    log.event_label && !log.event_label.startsWith("AUTO_") ? log.event_label : null;
  const leaveMeta = [log.leave_category, cleanLeaveLabel].filter(Boolean).join(" · ");

  return {
    tone: "leave" as const,
    title: "Leave",
    meta: leaveMeta || "Leave recorded",
  };
}

function SetupLinkIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7.5 5.833h-1.667A2.5 2.5 0 0 0 3.333 8.333v5.834a2.5 2.5 0 0 0 2.5 2.5h5.834a2.5 2.5 0 0 0 2.5-2.5V12.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.833 4.167H15.833V9.167"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.417 4.583L9.167 10.833"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AttendanceDashboard({
  initialLogs,
  initialMonthCache = {},
  initialMonthKey,
  todayKey,
  userId,
  fullName,
  email,
  initialSettings,
  arrivalUrl,
  leaveUrl,
}: AttendanceDashboardProps) {
  const firstName = getFirstName(fullName, email);
  const userInitial = getUserInitial(fullName, email);
  const identityName = fullName ?? firstName;
  const [localDateTime, setLocalDateTime] = useState("");
  const [monthKey, setMonthKey] = useState(initialMonthKey);
  const [logs, setLogs] = useState(initialLogs);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [activePanel, setActivePanel] = useState<DashboardPanelType | null>(null);
  const [renderedPanel, setRenderedPanel] = useState<DashboardPanelType | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [quickAction, setQuickAction] = useState<QuickActionType | null>(null);
  const [quickDate, setQuickDate] = useState("");
  const [quickLeaveCategory, setQuickLeaveCategory] = useState<LeaveCategory>("Casual Leave");
  const [quickLeaveNote, setQuickLeaveNote] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const [deleteEntryError, setDeleteEntryError] = useState("");
  const [settingsState, setSettingsState] = useState(initialSettings);
  const [hasHydrated, setHasHydrated] = useState(false);
  const monthCacheRef = useRef(new Map<string, DashboardAttendanceLog[]>(Object.entries(initialMonthCache)));
  const refreshTimeoutRef = useRef<number | null>(null);

  async function fetchMonthLogs(targetMonth: string) {
    const response = await fetch(`/api/attendance?month=${targetMonth}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as {
      logs?: DashboardAttendanceLog[];
    };

    if (!response.ok) {
      return null;
    }

    const nextLogs = payload.logs ?? [];
    monthCacheRef.current.set(targetMonth, nextLogs);
    return nextLogs;
  }

  function openMonth(targetMonthKey: string, nextSelectedDateKey: string | null = null) {
    if (targetMonthKey === monthKey && nextSelectedDateKey === selectedDateKey) {
      return;
    }

    setSelectedDateKey(nextSelectedDateKey);
    const cachedLogs = monthCacheRef.current.get(targetMonthKey);

    if (cachedLogs) {
      setLogs(cachedLogs);
      setLoadingMonth(false);
    } else {
      setLoadingMonth(true);
      setLogs([]);
    }

    setMonthKey(targetMonthKey);
  }

  function changeMonth(delta: number) {
    const nextMonthKey = getNextMonthKey(monthKey, delta);
    if (nextMonthKey === monthKey) {
      return;
    }

    openMonth(nextMonthKey, null);
  }

  function handleDateCellClick(dateKey: string, inCurrentMonth: boolean) {
    if (inCurrentMonth) {
      const isSameDate = selectedDateKey === dateKey;
      setSelectedDateKey(isSameDate ? null : dateKey);
      setActivePanel(isSameDate ? null : "activity");
      return;
    }

    setActivePanel("activity");
    openMonth(dateKey.slice(0, 7), dateKey);
  }

  useEffect(() => {
    monthCacheRef.current = new Map<string, DashboardAttendanceLog[]>(Object.entries(initialMonthCache));
    monthCacheRef.current.set(initialMonthKey, initialLogs);

    if (monthKey === initialMonthKey) {
      setLogs(monthCacheRef.current.get(initialMonthKey) ?? initialLogs);
      setLoadingMonth(false);
      setSelectedDateKey((current) => (current?.startsWith(monthKey) ? current : null));
      return;
    }

    const cachedLogs = monthCacheRef.current.get(monthKey);
    if (cachedLogs) {
      setLogs(cachedLogs);
      setLoadingMonth(false);
      setSelectedDateKey((current) => (current?.startsWith(monthKey) ? current : null));
      return;
    }

    let active = true;

    async function loadMonth(targetMonth: string) {
      setLoadingMonth(true);

      try {
        const nextLogs = await fetchMonthLogs(targetMonth);

        if (!nextLogs || !active) {
          return;
        }

        setLogs(nextLogs);
        setSelectedDateKey((current) => (current?.startsWith(targetMonth) ? current : null));
      } finally {
        if (active) {
          setLoadingMonth(false);
        }
      }
    }

    void loadMonth(monthKey);

    return () => {
      active = false;
    };
  }, [initialLogs, initialMonthCache, initialMonthKey, monthKey, todayKey]);

  useEffect(() => {
    const previousMonthKey = getNextMonthKey(monthKey, -1);
    const nextMonthKey = getNextMonthKey(monthKey, 1);

    if (!monthCacheRef.current.has(previousMonthKey)) {
      void fetchMonthLogs(previousMonthKey);
    }

    if (!monthCacheRef.current.has(nextMonthKey)) {
      void fetchMonthLogs(nextMonthKey);
    }
  }, [monthKey]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    function updateLocalClock() {
      setLocalDateTime(
        new Intl.DateTimeFormat("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    }

    updateLocalClock();
    const intervalId = window.setInterval(updateLocalClock, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!quickAction) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setQuickAction(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [quickAction]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActivePanel(null);
      }
    }

    if (!activePanel) {
      return undefined;
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePanel]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (activePanel) {
      setRenderedPanel(activePanel);
      const timeoutId = window.setTimeout(() => {
        setIsRightPanelOpen(true);
      }, RIGHT_PANEL_ENTER_DELAY_MS);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    setIsRightPanelOpen(false);

    const timeoutId = window.setTimeout(() => {
      setRenderedPanel(null);
    }, RIGHT_PANEL_TRANSITION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activePanel]);

  function togglePanel(panel: DashboardPanelType) {
    setActivePanel((current) => (current === panel ? null : panel));
  }

  function handleSettingsSaved(nextSettings: AttendanceSettingsPayload) {
    setSettingsState(nextSettings);

    startTransition(async () => {
      monthCacheRef.current.clear();

      const nextLogs = await fetchMonthLogs(monthKey);

      if (!nextLogs) {
        return;
      }

      setLogs(nextLogs);
      setSelectedDateKey((current) => (current?.startsWith(monthKey) ? current : null));

      const previousMonthKey = getNextMonthKey(monthKey, -1);
      const nextMonthKey = getNextMonthKey(monthKey, 1);

      void fetchMonthLogs(previousMonthKey);
      void fetchMonthLogs(nextMonthKey);
    });
  }

  async function refreshSettingsState() {
    const response = await fetch("/api/settings/attendance", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json().catch(() => null)) as AttendanceSettingsPayload | null;
    if (payload) {
      setSettingsState(payload);
    }
  }

  async function handleDeleteEntry(entryId: number) {
    setDeletingEntryId(entryId);
    setDeleteEntryError("");

    try {
      const response = await fetch(`/api/attendance/${entryId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setDeleteEntryError(payload.error ?? "Could not delete entry.");
        return false;
      }

      const nextLogs = logs.filter((log) => log.id !== entryId);
      setLogs(nextLogs);
      monthCacheRef.current.set(monthKey, nextLogs);
      await refreshSettingsState();
      return true;
    } finally {
      setDeletingEntryId(null);
    }
  }

  async function handleAddEntry(dateKey: string, payload: AddRecordInput) {
    const eventTime =
      payload.type === "IN" || payload.type === "OUT"
        ? `${dateKey}T${payload.time ?? "09:00"}:00`
        : `${dateKey}T00:00:00`;

    const eventType = payload.type === "WEEKLY_OFF" ? "LEAVE" : payload.type;
    const leaveCategory =
      payload.type === "LEAVE"
        ? payload.leaveCategory ?? "Casual Leave"
        : payload.type === "WEEKLY_OFF"
          ? "Weekly Off"
          : null;
    const eventLabel =
      payload.type === "WEEKLY_OFF"
        ? "Manual Weekly Off"
        : payload.type === "LEAVE"
          ? payload.label?.trim() || null
          : null;

    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType,
        eventTime,
        leaveCategory,
        eventLabel,
      }),
    });

    const responsePayload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      throw new Error(responsePayload.error ?? "Could not add record.");
    }

    monthCacheRef.current.delete(monthKey);
    const nextLogs = await fetchMonthLogs(monthKey);
    if (nextLogs) {
      setLogs(nextLogs);
      setSelectedDateKey((current) => (current?.startsWith(monthKey) ? current : null));
    }

    await refreshSettingsState();
  }

  function openQuickAction(action: QuickActionType) {
    setQuickAction(action);
    setQuickError("");
    setQuickSaving(false);
    setQuickDate(selectedDateKey ?? todayKey);
    setQuickLeaveCategory("Casual Leave");
    setQuickLeaveNote("");
  }

  async function saveQuickAction() {
    if (!quickAction || !quickDate) {
      setQuickError("Choose a date first.");
      return;
    }

    setQuickSaving(true);
    setQuickError("");

    try {
      const settingsResponse = await fetch("/api/settings/attendance", {
        method: "GET",
        cache: "no-store",
      });

      const settingsPayload = (await settingsResponse.json().catch(() => ({}))) as {
        error?: string;
        recurringRules?: RecurringLeaveRule[];
        leaveDates?: LeaveDateInput[];
        wfhDates?: WfhDateInput[];
      };

      if (!settingsResponse.ok) {
        setQuickError(settingsPayload.error ?? "Could not load settings.");
        return;
      }

      const recurringRules = settingsPayload.recurringRules ?? [];
      const leaveDates = settingsPayload.leaveDates ?? [];
      const wfhDates = settingsPayload.wfhDates ?? [];

      if (quickAction === "leave") {
        if (leaveDates.some((item) => item.date === quickDate)) {
          setQuickError("That leave date already exists.");
          return;
        }

        if (wfhDates.some((item) => item.date === quickDate)) {
          setQuickError("That date is already marked as work from home.");
          return;
        }
      }

      if (quickAction === "wfh") {
        if (wfhDates.some((item) => item.date === quickDate)) {
          setQuickError("That work-from-home date already exists.");
          return;
        }

        if (leaveDates.some((item) => item.date === quickDate)) {
          setQuickError("That date is already marked as leave.");
          return;
        }
      }

      const nextLeaveDates =
        quickAction === "leave"
          ? [...leaveDates, { date: quickDate, category: quickLeaveCategory, label: quickLeaveNote.trim() }].sort(
              (left, right) => left.date.localeCompare(right.date),
            )
          : leaveDates;

      const nextWfhDates =
        quickAction === "wfh"
          ? [...wfhDates, { date: quickDate }].sort((left, right) => left.date.localeCompare(right.date))
          : wfhDates;

      const saveResponse = await fetch("/api/settings/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recurringRules,
          leaveDates: nextLeaveDates,
          wfhDates: nextWfhDates,
        }),
      });

      const savePayload = (await saveResponse.json().catch(() => ({}))) as { error?: string };

      if (!saveResponse.ok) {
        setQuickError(savePayload.error ?? "Could not save changes.");
        return;
      }

      const nextLogs = await fetchMonthLogs(monthKey);
      if (nextLogs) {
        setLogs(nextLogs);
      }

      setQuickAction(null);
    } finally {
      setQuickSaving(false);
    }
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    function refreshCurrentMonth() {
      startTransition(async () => {
        const nextLogs = await fetchMonthLogs(monthKey);

        if (!nextLogs) {
          return;
        }

        setLogs(nextLogs);
        setSelectedDateKey((current) =>
          current && current.startsWith(monthKey) ? current : null,
        );
      });
    }

    function scheduleRefreshCurrentMonth() {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        refreshTimeoutRef.current = null;
        void refreshCurrentMonth();
      }, 180);
    }

    const channel = supabase
      .channel(`attendance-dashboard-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_logs",
          filter: `user_id=eq.${userId}`,
        },
        scheduleRefreshCurrentMonth,
      )
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      void supabase.removeChannel(channel);
    };
  }, [monthKey, todayKey, userId]);

  const logsByDate = useMemo(() => {
    const grouped = new Map<string, DashboardAttendanceLog[]>();

    for (const log of logs) {
      const dateKey = getDateKeyFromTimestamp(log.event_time);
      const current = grouped.get(dateKey) ?? [];
      current.push(log);
      grouped.set(dateKey, current);
    }

    for (const [dateKey, dateLogs] of grouped) {
      grouped.set(
        dateKey,
        [...dateLogs].sort(
          (left, right) =>
            new Date(left.event_time).getTime() - new Date(right.event_time).getTime(),
        ),
      );
    }

    return grouped;
  }, [logs]);

  const stats = useMemo<DashboardStatSummary>(() => {
    const presentDays = new Set<string>();
    const leaveDays = new Set<string>();
    const wfhDays = new Set<string>();

    for (const [dateKey, dateLogs] of logsByDate) {
      for (const log of dateLogs) {
        if (log.event_type === "IN" || log.event_type === "OUT") {
          presentDays.add(dateKey);
        }

        if (log.event_type === "LEAVE" && !isWeeklyOffLog(log)) {
          leaveDays.add(dateKey);
        }

        if (log.event_type === "WFH") {
          wfhDays.add(dateKey);
        }
      }
    }

    return {
      presentDays: presentDays.size,
      leaveDays: leaveDays.size,
      wfhDays: wfhDays.size,
    };
  }, [logsByDate]);

  const leaveEntries = useMemo<DashboardListEntry[]>(() => {
    const grouped = new Map<string, { label: string | null; category: string | null }>();

    for (const log of logs) {
      if (log.event_type !== "LEAVE" || isWeeklyOffLog(log)) {
        continue;
      }

      const dateKey = getDateKeyFromTimestamp(log.event_time);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          label: log.event_label,
          category: log.leave_category,
        });
      }
    }

    return [...grouped.entries()].map(([dateKey, meta]) => ({
      dateKey,
      dateLabel: getShortDateLabel(dateKey),
      detail: meta.category || meta.label || "Leave",
    }));
  }, [logs]);

  const presentEntries = useMemo<DashboardListEntry[]>(() => {
    const grouped = new Set<string>();

    for (const log of logs) {
      if (log.event_type !== "IN" && log.event_type !== "OUT") {
        continue;
      }

      grouped.add(getDateKeyFromTimestamp(log.event_time));
    }

    return [...grouped]
      .sort((left, right) => left.localeCompare(right))
      .map((dateKey) => ({
        dateKey,
        dateLabel: getShortDateLabel(dateKey),
        detail: "Present",
      }));
  }, [logs]);

  const wfhEntries = useMemo<DashboardListEntry[]>(() => {
    const grouped = new Set<string>();

    for (const log of logs) {
      if (log.event_type !== "WFH") {
        continue;
      }

      grouped.add(getDateKeyFromTimestamp(log.event_time));
    }

    return [...grouped].map((dateKey) => ({
      dateKey,
      dateLabel: getShortDateLabel(dateKey),
    }));
  }, [logs]);

  const explicitLeaveDateSet = useMemo(
    () => new Set(settingsState.leaveDates.map((item) => item.date)),
    [settingsState.leaveDates],
  );

  const wfhDateSet = useMemo(
    () => new Set(settingsState.wfhDates.map((item) => item.date)),
    [settingsState.wfhDates],
  );

  const derivedWeeklyOffDateSet = useMemo(() => {
    if (!hasHydrated) {
      return new Set<string>();
    }

    const [year, month] = monthKey.split("-").map(Number);
    const totalDays = new Date(year, month, 0).getDate();
    const nextDateKeys = new Set<string>();

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month - 1, day);
      const dateKey = getDateKey(date);
      const dayLogs = logsByDate.get(dateKey) ?? [];
      const hasPresent = dayLogs.some(
        (log) => log.event_type === "IN" || log.event_type === "OUT",
      );
      const hasExplicitLeave = explicitLeaveDateSet.has(dateKey);
      const hasWfh = wfhDateSet.has(dateKey);

      if (hasPresent || hasExplicitLeave || hasWfh) {
        continue;
      }

      if (
        settingsState.recurringRules.some((rule) =>
          doesRecurringRuleMatchDate(dateKey, rule),
        )
      ) {
        nextDateKeys.add(dateKey);
      }
    }

    return nextDateKeys;
  }, [
    hasHydrated,
    explicitLeaveDateSet,
    logsByDate,
    monthKey,
    settingsState.recurringRules,
    wfhDateSet,
  ]);

  const { calendarCells, calendarRowCount } = useMemo(() => {
    const [year, month] = monthKey.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const firstWeekday = firstDay.getDay();
    const totalDays = new Date(year, month, 0).getDate();
    const previousMonthDays = new Date(year, month - 1, 0).getDate();
    const totalGridCells = Math.ceil((firstWeekday + totalDays) / 7) * 7;
    const cells: CalendarCell[] = [];

    for (let index = 0; index < totalGridCells; index += 1) {
      const relativeDay = index - firstWeekday + 1;
      let date: Date;
      let inCurrentMonth = true;

      if (relativeDay <= 0) {
        date = new Date(year, month - 2, previousMonthDays + relativeDay);
        inCurrentMonth = false;
      } else if (relativeDay > totalDays) {
        date = new Date(year, month - 1, relativeDay);
        inCurrentMonth = false;
      } else {
        date = new Date(year, month - 1, relativeDay);
      }

      const dateKey = getDateKey(date);
      const sourceDayLogs = logsByDate.get(dateKey) ?? [];
      const dayLogs = hasHydrated
        ? sourceDayLogs.filter((log) => !isAutoWeeklyOffLog(log))
        : sourceDayLogs;
      const hasPresent = dayLogs.some(
        (log) => log.event_type === "IN" || log.event_type === "OUT",
      );
      const hasWeeklyOff =
        dayLogs.some((log) => isWeeklyOffLog(log)) ||
        (hasHydrated && derivedWeeklyOffDateSet.has(dateKey));
      const hasLeave = dayLogs.some(
        (log) => log.event_type === "LEAVE" && !isWeeklyOffLog(log),
      );
      const hasWfh = dayLogs.some((log) => log.event_type === "WFH");
      const badges: CalendarBadge[] = [];

      if (hasWeeklyOff) {
        badges.push({
          label: "Weekly Off",
          tone: "weekoff",
        });
      }

      const leaveLog = dayLogs.find(
        (log) => log.event_type === "LEAVE" && !isWeeklyOffLog(log),
      );

      if (leaveLog) {
        badges.push({
          label: leaveLog.leave_category || leaveLog.event_label || "Leave",
          tone: "leave",
        });
      }

      if (hasWfh) {
        badges.push({
          label: "WFH",
          tone: "wfh",
        });
      }

      const presentLogs = dayLogs.filter(
        (log) => log.event_type === "IN" || log.event_type === "OUT",
      );

      for (const presentLog of presentLogs) {
        badges.push({
          label: `${presentLog.event_type === "IN" ? "In" : "Out"} ${getTimeLabel(presentLog.event_time)}`,
          tone: presentLog.event_type === "IN" ? "present-in" : "present-out",
        });
      }

      const maxBadgeSlots = 2;
      const visibleBadges =
        badges.length > maxBadgeSlots
          ? [
              ...badges.slice(0, maxBadgeSlots - 1),
              {
                label: `+${badges.length - (maxBadgeSlots - 1)} more`,
                tone: "summary" as const,
              },
            ]
          : badges;

      cells.push({
        dateKey,
        dayNumber: date.getDate(),
        inCurrentMonth,
        isToday: dateKey === todayKey,
        hasPresent,
        hasLeave,
        hasWeeklyOff,
        hasWfh,
        badges: visibleBadges,
      });
    }

    return {
      calendarCells: cells,
      calendarRowCount: totalGridCells / 7,
    };
  }, [derivedWeeklyOffDateSet, hasHydrated, logsByDate, monthKey, todayKey]);

  const selectedDateDetail = useMemo<SelectedDateDetail | null>(() => {
    if (!selectedDateKey) {
      return null;
    }

    const sourceDayLogs = logsByDate.get(selectedDateKey) ?? [];
    const dayLogs = hasHydrated
      ? sourceDayLogs.filter((log) => !isAutoWeeklyOffLog(log))
      : sourceDayLogs;
    const seenAllDayEntries = new Set<string>();
    const entries = dayLogs.flatMap((log) => {
      if (
        log.event_type !== "IN" &&
        log.event_type !== "OUT" &&
        log.event_type !== "LEAVE" &&
        log.event_type !== "WFH"
      ) {
        return [];
      }

      if (log.event_type === "LEAVE" || log.event_type === "WFH") {
        const cleanLabel =
          log.event_label && !log.event_label.startsWith("AUTO_") ? log.event_label : "";
        const dedupeKey = [
          log.event_type,
          log.event_time.slice(0, 10),
          log.leave_category ?? "",
          cleanLabel,
        ].join("|");

        if (seenAllDayEntries.has(dedupeKey)) {
          return [];
        }

        seenAllDayEntries.add(dedupeKey);
      }

      return [
        {
          id: log.id,
          deletable: !isAutoWeeklyOffLog(log),
          ...getSelectedDateEntry(log),
        },
      ];
    });

    if (
      hasHydrated &&
      derivedWeeklyOffDateSet.has(selectedDateKey) &&
      !entries.some((entry) => entry.tone === "weekoff")
    ) {
      entries.unshift({
        id: Number.MIN_SAFE_INTEGER,
        deletable: false,
        tone: "weekoff",
        title: "Leave",
        meta: "Weekly Off",
      });
    }

    return {
      label: getLongDateLabel(selectedDateKey),
      entries,
    };
  }, [derivedWeeklyOffDateSet, hasHydrated, logsByDate, selectedDateKey]);

  const mobileHeaderPanel =
    isMobileViewport && (renderedPanel === "settings" || renderedPanel === "setup")
      ? renderedPanel
      : null;
  const sidePanel =
    !isMobileViewport || renderedPanel === "activity" ? renderedPanel : null;

  return (
    <>
      <DashboardTopPanel
        firstName={firstName}
        localDateTime={localDateTime}
        identityName={identityName}
        email={email}
        userInitial={userInitial}
        activePanel={activePanel}
        isMobileViewport={isMobileViewport}
        mobileExpandedPanel={mobileHeaderPanel}
        isMobileExpandedOpen={Boolean(mobileHeaderPanel && isRightPanelOpen)}
        mobileExpandedContent={
          mobileHeaderPanel === "settings" ? (
            <SettingsForm
              showBackLink={false}
              initialSettings={settingsState}
              onSettingsSaved={handleSettingsSaved}
            />
          ) : mobileHeaderPanel === "setup" ? (
            <SetupPanelContent
              arrivalUrl={arrivalUrl}
              leaveUrl={leaveUrl}
              showIntro={false}
              showActions={false}
            />
          ) : null
        }
        onToggleSetup={() => togglePanel("setup")}
        onToggleSettings={() => togglePanel("settings")}
        setupIcon={<SetupLinkIcon />}
      />

      <section className={`app-attendance-board${sidePanel ? " has-right-panel" : ""}`}>
        <DashboardLeftPanel
          monthLabel={getMonthLabel(monthKey)}
          stats={stats}
          presentEntries={presentEntries}
          leaveEntries={leaveEntries}
          wfhEntries={wfhEntries}
          onPreviousMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
          onAddLeave={() => openQuickAction("leave")}
          onAddWfh={() => openQuickAction("wfh")}
        />

        <div
          className={`app-attendance-main-stage${sidePanel && isRightPanelOpen ? " has-panel-open" : ""}`}
        >
          <DashboardMiddlePanel
            dayLabels={DAY_LABELS}
            calendarCells={calendarCells}
            calendarRowCount={calendarRowCount}
            loadingMonth={loadingMonth}
            selectedDateKey={selectedDateKey}
            onDateClick={handleDateCellClick}
          />

          <DashboardRightPanel
            activePanel={sidePanel}
            isOpen={Boolean(sidePanel && isRightPanelOpen)}
            selectedDateDetail={selectedDateDetail}
            selectedDateKey={selectedDateKey}
            settingsState={settingsState}
            arrivalUrl={arrivalUrl}
            leaveUrl={leaveUrl}
            deletingEntryId={deletingEntryId}
            deleteEntryError={deleteEntryError}
            onClose={() => setActivePanel(null)}
            onCloseActivity={() => {
              setDeleteEntryError("");
              setActivePanel(null);
              setSelectedDateKey(null);
            }}
            onDeleteEntry={handleDeleteEntry}
            onAddEntry={handleAddEntry}
            onSettingsSaved={handleSettingsSaved}
          />
        </div>
      </section>

      {quickAction ? (
        <div
          className="app-dashboard-modal-backdrop"
          onClick={() => setQuickAction(null)}
          role="presentation"
        >
          <section
            className="app-dashboard-modal app-dashboard-quick-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-quick-action-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="app-dashboard-modal-header">
              <div className="app-dashboard-modal-copy">
                <p className="app-eyebrow">{quickAction === "leave" ? "Leave" : "Work from home"}</p>
                <h2 className="app-subtitle" id="dashboard-quick-action-title">
                  {quickAction === "leave" ? "Add leave date." : "Add work-from-home date."}
                </h2>
              </div>
              <button
                type="button"
                className="app-dashboard-modal-close"
                aria-label="Close dialog"
                onClick={() => setQuickAction(null)}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-5" />
              </button>
            </div>

            {quickError ? <div className="app-error">{quickError}</div> : null}

            <div className="app-form">
              <label className="app-field">
                <span>Date</span>
                <input
                  className="app-input"
                  type="date"
                  value={quickDate}
                  onChange={(event) => setQuickDate(event.target.value)}
                />
              </label>

              {quickAction === "leave" ? (
                <>
                  <label className="app-field">
                    <span>Leave type</span>
                    <select
                      className="app-input"
                      value={quickLeaveCategory}
                      onChange={(event) => setQuickLeaveCategory(event.target.value as LeaveCategory)}
                    >
                      {LEAVE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="app-field">
                    <span>Note</span>
                    <input
                      className="app-input"
                      type="text"
                      placeholder="Optional note"
                      value={quickLeaveNote}
                      onChange={(event) => setQuickLeaveNote(event.target.value)}
                    />
                  </label>
                </>
              ) : null}

              <div className="app-inline-actions">
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={() => setQuickAction(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="app-button app-button-primary"
                  disabled={quickSaving}
                  onClick={saveQuickAction}
                >
                  {quickSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

    </>
  );
}
