const calendarDays = [
  { n: 28, type: "other" },
  { n: 29, type: "other" },
  { n: 30, type: "other" },
  { n: 1, type: "in" },
  { n: 2, type: "in" },
  { n: 3, type: "" },
  { n: 4, type: "" },
  { n: 5, type: "wfh" },
  { n: 6, type: "in" },
  { n: 7, type: "leave" },
  { n: 8, type: "in" },
  { n: 9, type: "out" },
  { n: 10, type: "" },
  { n: 11, type: "" },
  { n: 12, type: "in" },
  { n: 13, type: "in" },
  { n: 14, type: "wfh" },
  { n: 15, type: "today" },
  { n: 16, type: "in" },
  { n: 17, type: "" },
  { n: 18, type: "" },
] as const;

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function MarketingDashboardPreview() {
  return (
    <div className="marketing-home-preview">
      <div className="marketing-home-preview-bar">
        <span className="marketing-home-preview-dot marketing-home-preview-dot-red" />
        <span className="marketing-home-preview-dot marketing-home-preview-dot-yellow" />
        <span className="marketing-home-preview-dot marketing-home-preview-dot-green" />
        <div className="marketing-home-preview-url">attend.app/dashboard</div>
      </div>

      <div className="marketing-home-calendar">
        {weekdayLabels.map((day) => (
          <div key={day} className="marketing-home-calendar-header">
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => (
          <div
            key={`${day.n}-${index}`}
            className={[
              "marketing-home-calendar-day",
              day.type === "other" ? "marketing-home-calendar-day-other" : "",
              day.type === "today" ? "marketing-home-calendar-day-today" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="marketing-home-calendar-number">{day.n}</div>
            {day.type && day.type !== "other" ? (
              <div
                className={`marketing-home-calendar-pip marketing-home-calendar-pip-${day.type}`}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
