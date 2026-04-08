export type AttendanceEventType = "IN" | "OUT" | "LEAVE" | "WFH";

export type DashboardAttendanceLog = {
  id: number;
  event_type: AttendanceEventType;
  event_time: string;
  leave_category: string | null;
  event_label: string | null;
};

export type CalendarBadgeTone =
  | "present-in"
  | "present-out"
  | "leave"
  | "weekoff"
  | "wfh"
  | "summary";

export type CalendarBadge = {
  label: string;
  tone: CalendarBadgeTone;
};

export type DashboardPanelType = "settings" | "setup" | "activity";

export type DashboardStatSummary = {
  presentDays: number;
  leaveDays: number;
  wfhDays: number;
};

export type DashboardListEntry = {
  dateKey: string;
  dateLabel: string;
  detail?: string;
};

export type CalendarCell = {
  dateKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  hasPresent: boolean;
  hasLeave: boolean;
  hasWeeklyOff: boolean;
  hasWfh: boolean;
  badges: CalendarBadge[];
};

export type SelectedDateEntry = {
  id: number;
  title: string;
  value?: string;
  meta: string;
  deletable: boolean;
};

export type SelectedDateDetail = {
  label: string;
  entries: SelectedDateEntry[];
};
