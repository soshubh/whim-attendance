import { redirect } from "next/navigation";

import { getAttendancePath } from "@/lib/attendance-handle";
import { isAdminProfile } from "@/lib/admin-access";
import { requireAuthenticatedContext } from "@/lib/auth";

export default async function AttendanceIndexPage() {
  const { user, profile } = await requireAuthenticatedContext();

  if (isAdminProfile(profile)) {
    redirect("/admin");
  }

  redirect(
    getAttendancePath({
      email: user.email ?? null,
      fullName: profile?.full_name ?? null,
      userId: user.id,
    }),
  );
}
