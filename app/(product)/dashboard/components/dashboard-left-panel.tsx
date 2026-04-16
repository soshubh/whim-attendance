"use client";

import { useEffect, useState } from "react";

import type { DashboardListEntry, DashboardStatSummary } from "../dashboard-shared";
import { DashboardSurfaceCard } from "./dashboard-surface-card";

type DashboardLeftPanelProps = {
  monthLabel: string;
  stats: DashboardStatSummary;
  presentEntries: DashboardListEntry[];
  leaveEntries: DashboardListEntry[];
  wfhEntries: DashboardListEntry[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onAddLeave: () => void;
  onAddWfh: () => void;
};

export function DashboardLeftPanel({
  monthLabel,
  stats,
  presentEntries,
  leaveEntries,
  wfhEntries,
  onPreviousMonth,
  onNextMonth,
  onAddLeave,
  onAddWfh,
}: DashboardLeftPanelProps) {
  const [openSection, setOpenSection] = useState<"present" | "leave" | "wfh" | null>(null);
  const [isCompactMobile, setIsCompactMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1100px)");
    const compactMobileQuery = window.matchMedia("(max-width: 720px)");

    function syncOpenSection(event?: MediaQueryList | MediaQueryListEvent) {
      const isMobile = ("matches" in (event ?? mediaQuery) ? (event ?? mediaQuery).matches : mediaQuery.matches);
      setOpenSection((current) => {
        if (isMobile) {
          return null;
        }

        return current ?? "present";
      });
    }

    function syncCompactMobile(
      event?: MediaQueryList | MediaQueryListEvent,
    ) {
      const isCompact =
        "matches" in (event ?? compactMobileQuery)
          ? (event ?? compactMobileQuery).matches
          : compactMobileQuery.matches;

      setIsCompactMobile(isCompact);
    }

    syncOpenSection();
    syncCompactMobile();

    mediaQuery.addEventListener("change", syncOpenSection);
    compactMobileQuery.addEventListener("change", syncCompactMobile);
    return () => {
      mediaQuery.removeEventListener("change", syncOpenSection);
      compactMobileQuery.removeEventListener("change", syncCompactMobile);
    };
  }, []);

  function renderEntries(entries: DashboardListEntry[], fallbackDetail: string) {
    if (!entries.length) {
      return <div className="app-attendance-stat-empty">No dates added.</div>;
    }

    return (
      <div className="app-attendance-stat-list">
        {entries.map((entry) => (
          <div className="app-attendance-stat-list-item" key={entry.dateKey}>
            <b>{entry.dateLabel}</b>
            <small>{entry.detail ?? fallbackDetail}</small>
          </div>
        ))}
      </div>
    );
  }

  function renderDropdownTrigger(
    section: "present" | "leave" | "wfh",
    label: string,
  ) {
    const isOpen = openSection === section;

    return (
      <button
        type="button"
        className={`app-attendance-stat-card-dropdown${isOpen ? " is-open" : ""}`}
        aria-expanded={isOpen}
        onClick={() => setOpenSection((current) => (current === section ? null : section))}
      >
        <span className="app-attendance-stat-card-dropdown-label">{label}</span>
      </button>
    );
  }

  return (
    <DashboardSurfaceCard
      as="aside"
      variant="sidebar"
      className="app-attendance-sidebar-card"
    >
      <div className="app-attendance-sidebar-stack">
        <div className="app-attendance-sidebar-fixed">
          <div className="app-attendance-month-nav">
            <button
              type="button"
              className="app-attendance-nav-button"
              onClick={onPreviousMonth}
              aria-label="Previous month"
            >
              &#8249;
            </button>
            <span className="app-attendance-month-label">{monthLabel}</span>
            <button
              type="button"
              className="app-attendance-nav-button"
              onClick={onNextMonth}
              aria-label="Next month"
            >
              &#8250;
            </button>
          </div>

          {isCompactMobile ? (
            <div className="app-attendance-mobile-top-summary" aria-label="Attendance summary">
              <article className="app-attendance-mobile-top-summary-card is-present">
                <span className="app-attendance-mobile-summary-label">Days Present</span>
                <strong className="app-attendance-mobile-summary-value">
                  {stats.presentDays}
                </strong>
              </article>
              <article className="app-attendance-mobile-top-summary-card is-leave">
                <span className="app-attendance-mobile-summary-label">Leave Days</span>
                <strong className="app-attendance-mobile-summary-value">
                  {stats.leaveDays}
                </strong>
              </article>
              <article className="app-attendance-mobile-top-summary-card is-wfh">
                <span className="app-attendance-mobile-summary-label">WFH Days</span>
                <strong className="app-attendance-mobile-summary-value">
                  {stats.wfhDays}
                </strong>
              </article>
            </div>
          ) : null}
        </div>

        {!isCompactMobile ? (
          <div className="app-attendance-sidebar-scroll">
            <section className="app-attendance-stats app-attendance-stats-sidebar">
              <article className={`app-attendance-stat-card${openSection === "present" ? " is-open" : ""}`}>
                <div className="app-attendance-stat-card-head">
                  <span className="app-attendance-stat-card-title">Days Present</span>
                </div>
                <div className={`app-attendance-stat-card-panel${openSection === "present" ? " is-open" : ""}`}>
                  <div className="app-attendance-stat-card-panel-inner">
                    {renderEntries(presentEntries, "Present")}
                  </div>
                </div>
                {renderDropdownTrigger("present", `${stats.presentDays} Days`)}
              </article>
              <article className={`app-attendance-stat-card${openSection === "leave" ? " is-open" : ""}`}>
                <div className="app-attendance-stat-card-head">
                  <span className="app-attendance-stat-card-title">Leave Days</span>
                  <button
                    type="button"
                    className="app-attendance-action-trigger"
                    aria-label="Add leave"
                    onClick={onAddLeave}
                  >
                    +
                  </button>
                </div>
                <div className={`app-attendance-stat-card-panel${openSection === "leave" ? " is-open" : ""}`}>
                  <div className="app-attendance-stat-card-panel-inner">
                    {renderEntries(leaveEntries, "Leave")}
                  </div>
                </div>
                {renderDropdownTrigger("leave", `${stats.leaveDays} Days`)}
              </article>
              <article className={`app-attendance-stat-card${openSection === "wfh" ? " is-open" : ""}`}>
                <div className="app-attendance-stat-card-head">
                  <span className="app-attendance-stat-card-title">WFH Days</span>
                  <button
                    type="button"
                    className="app-attendance-action-trigger"
                    aria-label="Add WFH"
                    onClick={onAddWfh}
                  >
                    +
                  </button>
                </div>
                <div className={`app-attendance-stat-card-panel${openSection === "wfh" ? " is-open" : ""}`}>
                  <div className="app-attendance-stat-card-panel-inner">
                    {renderEntries(wfhEntries, "WFH")}
                  </div>
                </div>
                {renderDropdownTrigger("wfh", `${stats.wfhDays} Days`)}
              </article>
            </section>
          </div>
        ) : null}
      </div>
    </DashboardSurfaceCard>
  );
}
