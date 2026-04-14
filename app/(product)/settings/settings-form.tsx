"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type {
  AttendanceSettingsPayload,
  LeaveDateInput,
  RecurringLeaveRuleInput,
  WfhDateInput,
} from "@/lib/attendance-settings";
import { useTheme } from "@/components/ui/theme-provider";

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
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
  const saveRequestIdRef = useRef(0);

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
      setLoading(false);
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, [initialSettings]);

  async function persistSettings(nextSettings: AttendanceSettingsPayload) {
    const requestId = saveRequestIdRef.current + 1;
    saveRequestIdRef.current = requestId;

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
      if (isMountedRef.current && saveRequestIdRef.current === requestId) {
        setError(payload.error ?? "Could not save settings.");
        setSaving(false);
      }
      return;
    }

    onSettingsSaved?.(nextSettings);

    if (!isMountedRef.current || saveRequestIdRef.current !== requestId) {
      return;
    }

    setSaving(false);
  }

  function toggleWeekday(weekday: number) {
    setRecurringRules((current) => {
      const exists = current.some((rule) => rule.weekday === weekday);

      const nextRules = exists
        ? current.filter((rule) => rule.weekday !== weekday)
        : [
            ...current,
            {
              weekday,
              mode: "every",
              pattern: null,
            } satisfies RecurringLeaveRuleInput,
          ].sort((left, right) => left.weekday - right.weekday);

      void persistSettings({
        recurringRules: nextRules,
        leaveDates,
        wfhDates,
      });

      return nextRules;
    });
  }

  function updateRecurringRule(
    weekday: number,
    next: Partial<Pick<RecurringLeaveRuleInput, "mode" | "pattern">>,
  ) {
    setRecurringRules((current) => {
      const nextRules = current.map((rule) => {
        if (rule.weekday !== weekday) {
          return rule;
        }

        const nextMode = next.mode ?? rule.mode;
        const nextPattern =
          nextMode === "alternate"
            ? (next.pattern ?? rule.pattern ?? "second-fourth")
            : null;

        return {
          ...rule,
          mode: nextMode,
          pattern: nextPattern,
        };
      });

      void persistSettings({
        recurringRules: nextRules,
        leaveDates,
        wfhDates,
      });

      return nextRules;
    });
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
            <p className="app-copy app-settings-preference-hint">
              Switch the dashboard appearance.
            </p>
          </div>
          <button
            type="button"
            className={`app-settings-switch${isDark ? " is-active" : ""}`}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            disabled={saving}
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
          <h2 className="app-settings-section-title">Weekly off days</h2>
          <p className="app-copy app-settings-preference-hint">
            Pick the days you&apos;re off each week.
          </p>
        </div>

        <div className="app-settings-weekday-list">
          {WEEKDAY_OPTIONS.map((weekday) => {
            const rule =
              recurringRules.find((currentRule) => currentRule.weekday === weekday.value) ?? null;
            const dayLabel = weekday.label;

            return (
              <div className="app-settings-weekday-item" key={weekday.value}>
                <div className="app-settings-preference-row app-settings-preference-row-weekday">
                  <div className="app-settings-preference-copy">
                    <h3 className="app-settings-day-title">{dayLabel}</h3>
                  </div>
                  <button
                    type="button"
                    className={`app-settings-switch${rule ? " is-active" : ""}`}
                    onClick={() => toggleWeekday(weekday.value)}
                    disabled={saving}
                    role="switch"
                    aria-checked={Boolean(rule)}
                    aria-label={`Toggle ${dayLabel} weekly off`}
                  >
                    <span className="app-settings-switch-track" aria-hidden="true">
                      <span className="app-settings-switch-thumb" />
                    </span>
                  </button>
                </div>

                {rule ? (
                  <div className="app-settings-rule-card">
                    <div className="app-settings-rule-options">
                      <button
                        type="button"
                        className={`app-settings-toggle${rule.mode === "every" ? " is-active" : ""}`}
                        onClick={() =>
                          updateRecurringRule(rule.weekday, { mode: "every" })
                        }
                        disabled={saving}
                      >
                        Every
                      </button>
                      <button
                        type="button"
                        className={`app-settings-toggle${rule.mode === "alternate" ? " is-active" : ""}`}
                        onClick={() =>
                          updateRecurringRule(rule.weekday, { mode: "alternate" })
                        }
                        disabled={saving}
                      >
                        Alternate
                      </button>
                    </div>

                    {rule.mode === "alternate" ? (
                      <div className="app-settings-rule-options">
                        <button
                          type="button"
                          className={`app-settings-toggle${
                            rule.pattern === "first-third" ? " is-active" : ""
                          }`}
                          onClick={() =>
                            updateRecurringRule(rule.weekday, {
                              pattern: "first-third",
                            })
                          }
                          disabled={saving}
                        >
                          1st & 3rd
                        </button>
                        <button
                          type="button"
                          className={`app-settings-toggle${
                            rule.pattern === "second-fourth" ? " is-active" : ""
                          }`}
                          onClick={() =>
                            updateRecurringRule(rule.weekday, {
                              pattern: "second-fourth",
                            })
                          }
                          disabled={saving}
                        >
                          2nd & 4th
                        </button>
                      </div>
                    ) : null}
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
            <Link className="app-button app-button-secondary" href="/attendance">
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
