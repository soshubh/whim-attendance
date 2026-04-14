import { AttendanceDashboardPage } from "../attendance-dashboard-page";

export default async function AttendanceHandlePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  return <AttendanceDashboardPage expectedHandle={handle} />;
}
