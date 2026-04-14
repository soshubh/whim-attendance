export function sanitizeAttendanceHandle(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || "workspace";
}

export function getAttendanceHandle(params: {
  email?: string | null;
  fullName?: string | null;
  userId: string;
}) {
  const emailLocalPart = params.email?.split("@")[0]?.trim();

  if (emailLocalPart) {
    return sanitizeAttendanceHandle(emailLocalPart);
  }

  if (params.fullName?.trim()) {
    return sanitizeAttendanceHandle(params.fullName);
  }

  return sanitizeAttendanceHandle(params.userId.slice(0, 8));
}

export function getAttendancePath(params: {
  email?: string | null;
  fullName?: string | null;
  userId: string;
}) {
  return `/attendance/${getAttendanceHandle(params)}`;
}
