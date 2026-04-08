import type { DashboardListEntry, DashboardStatSummary } from "../dashboard-shared";
import { DashboardSurfaceCard } from "./dashboard-surface-card";

type DashboardLeftPanelProps = {
  monthLabel: string;
  stats: DashboardStatSummary;
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
  leaveEntries,
  wfhEntries,
  onPreviousMonth,
  onNextMonth,
  onAddLeave,
  onAddWfh,
}: DashboardLeftPanelProps) {
  return (
    <DashboardSurfaceCard as="aside" variant="sidebar" className="app-attendance-sidebar-card">
      <div className="app-attendance-sidebar-stack">
        <div className="app-attendance-sidebar-fixed">
          <div className="app-attendance-month-panel">
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
          </div>

          <section className="app-attendance-stats app-attendance-stats-sidebar">
            <article className="app-attendance-stat-card app-attendance-stat-card-present">
              <span>Days Present</span>
              <strong>{stats.presentDays}</strong>
            </article>
            <article className="app-attendance-stat-card app-attendance-stat-card-leave">
              <span>Leave Days</span>
              <strong>{stats.leaveDays}</strong>
            </article>
            <article className="app-attendance-stat-card app-attendance-stat-card-wfh">
              <span>WFH Days</span>
              <strong>{stats.wfhDays}</strong>
            </article>
            <article className="app-attendance-stat-card app-attendance-stat-card-hours">
              <span>Avg Working Hours</span>
              <strong>{stats.averageWorkingHours}</strong>
            </article>
          </section>
        </div>

        <div className="app-attendance-sidebar-scroll">
          <div className="app-attendance-sidebar-actions">
            <div className="app-attendance-action-group">
              <div className="app-attendance-action-row">
                <span className="app-attendance-action-label">Add leave</span>
                <button
                  type="button"
                  className="app-attendance-action-trigger"
                  aria-label="Add leave"
                  onClick={onAddLeave}
                >
                  +
                </button>
              </div>
              {leaveEntries.length ? (
                <div className="app-attendance-sidebar-entry-list">
                  {leaveEntries.map((entry) => (
                    <div className="app-attendance-stat-list-item" key={entry.dateKey}>
                      <b>{entry.dateLabel}</b>
                      <small>{entry.detail}</small>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="app-attendance-action-group">
              <div className="app-attendance-action-row">
                <span className="app-attendance-action-label">Add WFH</span>
                <button
                  type="button"
                  className="app-attendance-action-trigger"
                  aria-label="Add WFH"
                  onClick={onAddWfh}
                >
                  +
                </button>
              </div>
              {wfhEntries.length ? (
                <div className="app-attendance-sidebar-entry-list">
                  {wfhEntries.map((entry) => (
                    <div className="app-attendance-stat-list-item" key={entry.dateKey}>
                      <b>{entry.dateLabel}</b>
                      <small>WFH</small>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </DashboardSurfaceCard>
  );
}
