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
  const isInteractive = true;
  const variantClass = !cell.inCurrentMonth
    ? "is-disabled"
    : isSelected
      ? "is-selected"
      : "is-default";

  function handleActivate() {
    onClick(cell.dateKey, cell.inCurrentMonth);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleActivate();
  }

  return (
    <div
      className={[
        "app-attendance-date-cell",
        variantClass,
        cell.isToday ? "is-today" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : -1}
      aria-pressed={cell.inCurrentMonth ? isSelected : undefined}
    >
      <div className="app-attendance-date-head">
        <span className="app-attendance-date-number">{cell.dayNumber}</span>
        {cell.inCurrentMonth && cell.isToday ? (
          <span className="app-attendance-date-marker" aria-hidden="true" />
        ) : null}
      </div>

      {cell.inCurrentMonth ? (
        <>
          {cell.badges.length ? (
            <div className="app-attendance-date-details">
              {cell.badges.map((badge, index) => (
                <span
                  key={`${cell.dateKey}-${badge.tone}-${badge.label}-${index}`}
                  className={`app-attendance-date-detail is-${badge.tone}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
