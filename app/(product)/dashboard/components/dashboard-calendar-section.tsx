import type { CalendarCell } from "../dashboard-shared";
import { DashboardSurfaceCard } from "./dashboard-surface-card";

type DashboardCalendarSectionProps = {
  dayLabels: string[];
  calendarCells: CalendarCell[];
  calendarRowCount: number;
  loadingMonth: boolean;
  selectedDateKey: string | null;
  onDateClick: (dateKey: string, inCurrentMonth: boolean) => void;
};

export function DashboardCalendarSection({
  dayLabels,
  calendarCells,
  calendarRowCount,
  loadingMonth,
  selectedDateKey,
  onDateClick,
}: DashboardCalendarSectionProps) {
  return (
    <section className="app-attendance-calendar-shell">
      <DashboardSurfaceCard variant="calendar" className="app-attendance-calendar-card">
        <div className="app-attendance-weekdays">
          {dayLabels.map((label) => (
            <div className="app-attendance-weekday" key={label}>
              {label}
            </div>
          ))}
        </div>

        <div className="app-attendance-calendar-body">
          <div className="app-attendance-grid-shell">
            <div
              className={`app-attendance-grid${loadingMonth ? " is-loading" : ""}`}
              style={{ gridTemplateRows: `repeat(${calendarRowCount}, minmax(0, 1fr))` }}
            >
              {calendarCells.map((cell) => (
                <button
                  type="button"
                  key={cell.dateKey}
                  className={[
                    "app-attendance-cell",
                    cell.hasPresent ? "is-present" : "",
                    cell.hasWeeklyOff ? "is-weekoff" : "",
                    cell.hasLeave ? "is-leave" : "",
                    cell.hasWfh ? "is-wfh" : "",
                    cell.inCurrentMonth ? "" : "is-muted",
                    cell.dateKey === selectedDateKey ? "is-selected" : "",
                    cell.isToday ? "is-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onDateClick(cell.dateKey, cell.inCurrentMonth)}
                  aria-pressed={cell.dateKey === selectedDateKey}
                >
                  <div className="app-attendance-day-meta">
                    <span className="app-attendance-day-number">{cell.dayNumber}</span>
                    {cell.isToday ? <span className="app-attendance-day-dot" aria-hidden="true" /> : null}
                  </div>
                  {cell.badges.length ? (
                    <div className="app-attendance-day-badges">
                      {cell.badges.map((badge, index) => (
                        <span
                          key={`${cell.dateKey}-${badge.tone}-${badge.label}-${index}`}
                          className={`app-attendance-day-badge is-${badge.tone}`}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DashboardSurfaceCard>
    </section>
  );
}
