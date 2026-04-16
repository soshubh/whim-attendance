import type { CalendarCell } from "../dashboard-shared";
import { DashboardDateCard } from "./dashboard-date-card";
import { DashboardSurfaceCard } from "./dashboard-surface-card";
import { DashboardWeekdayCell } from "./dashboard-weekday-cell";

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
        <div className="app-attendance-weekday-grid">
          {dayLabels.map((label) => (
            <DashboardWeekdayCell key={label} label={label} />
          ))}
        </div>

        <div
          className={`app-attendance-date-grid${loadingMonth ? " is-loading" : ""}`}
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
      </DashboardSurfaceCard>
    </section>
  );
}
