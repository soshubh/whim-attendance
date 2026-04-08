import type { CalendarCell } from "../dashboard-shared";
import { DashboardDateCard } from "./dashboard-date-card";
import { DashboardSurfaceCard } from "./dashboard-surface-card";

type DashboardMiddlePanelProps = {
  dayLabels: string[];
  calendarCells: CalendarCell[];
  calendarRowCount: number;
  loadingMonth: boolean;
  selectedDateKey: string | null;
  onDateClick: (dateKey: string, inCurrentMonth: boolean) => void;
};

export function DashboardMiddlePanel({
  dayLabels,
  calendarCells,
  calendarRowCount,
  loadingMonth,
  selectedDateKey,
  onDateClick,
}: DashboardMiddlePanelProps) {
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
                <DashboardDateCard
                  key={cell.dateKey}
                  cell={cell}
                  isSelected={cell.dateKey === selectedDateKey}
                  onClick={onDateClick}
                />
              ))}
            </div>
          </div>
        </div>
      </DashboardSurfaceCard>
    </section>
  );
}
