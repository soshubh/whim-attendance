type DashboardWeekdayCellProps = {
  label: string;
};

export function DashboardWeekdayCell({ label }: DashboardWeekdayCellProps) {
  return <div className="app-attendance-weekday-cell">{label}</div>;
}
