import { redirect } from "next/navigation";

import { getAttendancePath } from "@/lib/attendance-handle";
import { requireAuthenticatedContext } from "@/lib/auth";

export default async function AttendanceIndexPage() {
  const { user, profile } = await requireAuthenticatedContext();

  redirect(
    getAttendancePath({
      email: user.email ?? null,
      fullName: profile?.full_name ?? null,
      userId: user.id,
    }),
  );
}
