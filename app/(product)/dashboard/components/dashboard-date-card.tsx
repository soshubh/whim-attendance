import type { CalendarCell } from "../dashboard-shared";

type DashboardDateCardProps = {
  cell: CalendarCell;
  isSelected: boolean;
  onClick: (dateKey: string, inCurrentMonth: boolean) => void;
};

export function DashboardDateCard({
  cell,
  isSelected,
  onClick,
}: DashboardDateCardProps) {
  return (
    <button
      type="button"
      className={[
        "app-attendance-cell",
        cell.hasPresent ? "is-present" : "",
        cell.hasWeeklyOff ? "is-weekoff" : "",
        cell.hasLeave ? "is-leave" : "",
        cell.hasWfh ? "is-wfh" : "",
        cell.inCurrentMonth ? "" : "is-muted",
        isSelected ? "is-selected" : "",
        cell.isToday ? "is-today" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onClick(cell.dateKey, cell.inCurrentMonth)}
      aria-pressed={isSelected}
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
  );
}
