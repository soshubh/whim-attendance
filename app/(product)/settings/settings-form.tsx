"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type {
  AttendanceSettingsPayload,
  LeaveDateInput,
  RecurringLeaveRuleInput,
  RecurringLeaveWeek,
  WfhDateInput,
} from "@/lib/attendance-settings";
import { useTheme } from "@/components/ui/theme-provider";

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

const WEEK_ORDINAL_OPTIONS = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd" },
  { value: 4, label: "4th" },
  { value: 5, label: "5th" },
] as const;

type SettingsFormProps = {
  logoutHref?: string | null;
  showBackLink?: boolean;
  initialSettings?: AttendanceSettingsPayload | null;
  onSettingsSaved?: (settings: AttendanceSettingsPayload) => void;
};

export function SettingsForm({
  logoutHref = null,
  showBackLink = true,
  initialSettings = null,
  onSettingsSaved,
}: SettingsFormProps = {}) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const hasSecondaryFooterAction = showBackLink || Boolean(logoutHref);
  const [loading, setLoading] = useState(!initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [recurringRules, setRecurringRules] = useState<
    RecurringLeaveRuleInput[]
  >(initialSettings?.recurringRules ?? []);
  const [leaveDates, setLeaveDates] = useState<LeaveDateInput[]>(
    initialSettings?.leaveDates ?? [],
  );
  const [wfhDates, setWfhDates] = useState<WfhDateInput[]>(
    initialSettings?.wfhDates ?? [],
  );
  const isMountedRef = useRef(true);
  const saveInFlightRef = useRef(false);
  const queuedSettingsRef = useRef<AttendanceSettingsPayload | null>(null);
  const committedSettingsRef = useRef<AttendanceSettingsPayload>({
    recurringRules: initialSettings?.recurringRules ?? [],
    leaveDates: initialSettings?.leaveDates ?? [],
    wfhDates: initialSettings?.wfhDates ?? [],
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (theme === "default") {
      setTheme("light");
    }
  }, [setTheme, theme]);

  useEffect(() => {
    if (initialSettings) {
      return undefined;
    }

    let active = true;

    async function loadSettings() {
      setLoading(true);
      setError("");

      const response = await fetch("/api/settings/attendance", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        recurringRules?: RecurringLeaveRuleInput[];
        leaveDates?: LeaveDateInput[];
        wfhDates?: WfhDateInput[];
      };

      if (!active) {
        return;
      }

      if (!response.ok) {
        setError(payload.error ?? "Could not load settings.");
        setLoading(false);
        return;
      }

      setRecurringRules(payload.recurringRules ?? []);
      setLeaveDates(payload.leaveDates ?? []);
      setWfhDates(payload.wfhDates ?? []);
      committedSettingsRef.current = {
        recurringRules: payload.recurringRules ?? [],
        leaveDates: payload.leaveDates ?? [],
        wfhDates: payload.wfhDates ?? [],
      };
      setLoading(false);
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, [initialSettings]);

  async function flushQueuedSettings() {
    if (saveInFlightRef.current || !queuedSettingsRef.current) {
      return;
    }

    const nextSettings = queuedSettingsRef.current;
    queuedSettingsRef.current = null;
    saveInFlightRef.current = true;

    if (isMountedRef.current) {
      setSaving(true);
      setError("");
    }

    const response = await fetch("/api/settings/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nextSettings),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      if (isMountedRef.current && !queuedSettingsRef.current) {
        const rollbackSettings = committedSettingsRef.current;
        setRecurringRules(rollbackSettings.recurringRules);
        setLeaveDates(rollbackSettings.leaveDates);
        setWfhDates(rollbackSettings.wfhDates);
        onSettingsSaved?.(rollbackSettings);
        setError(payload.error ?? "Could not save settings.");
      }
    } else {
      committedSettingsRef.current = nextSettings;
    }

    saveInFlightRef.current = false;

    if (queuedSettingsRef.current) {
      void flushQueuedSettings();
      return;
    }

    if (isMountedRef.current) {
      setSaving(false);
    }
  }

  function persistSettings(nextSettings: AttendanceSettingsPayload) {
    onSettingsSaved?.(nextSettings);
    queuedSettingsRef.current = nextSettings;
    void flushQueuedSettings();
  }

  function toggleWeekday(weekday: number) {
    const previousRules = recurringRules;
    const exists = previousRules.some((rule) => rule.weekday === weekday);

    const nextRules = exists
      ? previousRules.filter((rule) => rule.weekday !== weekday)
      : [
          ...previousRules,
          {
            weekday,
            weeks: [1, 2, 3, 4, 5],
          } satisfies RecurringLeaveRuleInput,
        ].sort((left, right) => left.weekday - right.weekday);

    setRecurringRules(nextRules);
    persistSettings({
      recurringRules: nextRules,
      leaveDates,
      wfhDates,
    });
  }

  function updateRecurringRule(weekday: number, weeks: RecurringLeaveWeek[]) {
    const previousRules = recurringRules;
    const normalizedWeeks = [...new Set(weeks)].sort(
      (left, right) => left - right,
    ) as RecurringLeaveWeek[];
    const nextRules =
      normalizedWeeks.length === 0
        ? previousRules.filter((rule) => rule.weekday !== weekday)
        : previousRules.map((rule) =>
            rule.weekday !== weekday
              ? rule
              : {
                  ...rule,
                  weeks: normalizedWeeks,
                },
          );

    setRecurringRules(nextRules);
    persistSettings({
      recurringRules: nextRules,
      leaveDates,
      wfhDates,
    });
  }

  function getRuleSummary(rule: RecurringLeaveRuleInput | null) {
    if (!rule) {
      return "Off";
    }

    if (rule.weeks.length === 5) {
      return "Every week";
    }

    return WEEK_ORDINAL_OPTIONS.filter((option) =>
      rule.weeks.includes(option.value),
    )
      .map((option) => option.label)
      .join(", ");
  }

  function isOrdinalActive(
    rule: RecurringLeaveRuleInput | null,
    ordinal: RecurringLeaveWeek,
  ) {
    return Boolean(rule?.weeks.includes(ordinal));
  }

  function toggleRecurringWeek(weekday: number, ordinal: RecurringLeaveWeek) {
    const currentRule =
      recurringRules.find((rule) => rule.weekday === weekday) ?? null;
    const nextWeeks = currentRule?.weeks.includes(ordinal)
      ? currentRule.weeks.filter((week) => week !== ordinal)
      : [...(currentRule?.weeks ?? []), ordinal];

    updateRecurringRule(weekday, nextWeeks as RecurringLeaveWeek[]);
  }

  function handleRecurringWeekKeyDown(
    event: KeyboardEvent<HTMLSpanElement>,
    weekday: number,
    ordinal: RecurringLeaveWeek,
  ) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    toggleRecurringWeek(weekday, ordinal);
  }

  if (loading) {
    return <div className="app-empty-box">Loading settings…</div>;
  }

  return (
    <div className="app-settings-form-shell">
      {error ? <div className="app-error">{error}</div> : null}

      <section className="app-settings-block">
        <div className="app-settings-preference-row">
          <div className="app-settings-preference-copy">
            <h2 className="app-settings-section-title">Dark mode</h2>
          </div>
          <button
            type="button"
            className={`app-settings-switch${isDark ? " is-active" : ""}`}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
          >
            <span className="app-settings-switch-track" aria-hidden="true">
              <span className="app-settings-switch-thumb" />
            </span>
          </button>
        </div>
      </section>

      <section className="app-settings-block">
        <div className="app-settings-section-copy">
          <div className="app-settings-section-heading-row">
            <h2 className="app-settings-section-title">Weekly off days</h2>
            <div className="app-settings-info">
              <button
                type="button"
                className="app-settings-info-button"
                aria-label="Weekly off days info"
                aria-describedby="weekly-off-days-info"
              >
                i
              </button>
              <div
                className="app-settings-info-popover"
                id="weekly-off-days-info"
                role="tooltip"
              >
                Pick the days you&apos;re off each week.
              </div>
            </div>
          </div>
        </div>

        <div className="app-settings-weekday-list">
          {WEEKDAY_OPTIONS.map((weekday) => {
            const rule =
              recurringRules.find(
                (currentRule) => currentRule.weekday === weekday.value,
              ) ?? null;
            const dayLabel = weekday.label;

            return (
              <div
                className={`app-settings-weekday-item${rule ? " is-active" : ""}`}
                key={weekday.value}
              >
                <div className="app-settings-weekday-head">
                  <div className="app-settings-preference-copy app-settings-preference-copy-weekday">
                    <div className="app-settings-weekday-copy-line">
                      <h3 className="app-settings-day-title">{dayLabel}</h3>
                      <span className="app-settings-day-summary">
                        {getRuleSummary(rule)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`app-settings-switch${rule ? " is-active" : ""}`}
                    onClick={() => toggleWeekday(weekday.value)}
                    role="switch"
                    aria-checked={Boolean(rule)}
                    aria-label={`Toggle ${dayLabel} weekly off`}
                  >
                    <span
                      className="app-settings-switch-track"
                      aria-hidden="true"
                    >
                      <span className="app-settings-switch-thumb" />
                    </span>
                  </button>
                </div>

                {rule ? (
                  <div className="app-settings-rule-options">
                    {WEEK_ORDINAL_OPTIONS.map((option) => (
                      <span
                        key={option.value}
                        className="app-week-pill"
                        onClick={() =>
                          toggleRecurringWeek(rule.weekday, option.value)
                        }
                        onKeyDown={(event) =>
                          handleRecurringWeekKeyDown(
                            event,
                            rule.weekday,
                            option.value,
                          )
                        }
                        role="button"
                        tabIndex={0}
                        aria-pressed={isOrdinalActive(rule, option.value)}
                      >
                        {option.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {hasSecondaryFooterAction ? (
        <div className="app-inline-actions app-settings-actions">
          {showBackLink ? (
            <Link
              className="app-button app-button-secondary"
              href="/attendance"
            >
              Back to dashboard
            </Link>
          ) : logoutHref ? (
            <Link className="app-button app-button-secondary" href={logoutHref}>
              Log out
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
