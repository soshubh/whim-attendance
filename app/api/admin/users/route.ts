import { NextResponse } from "next/server";

import { assertAdminAccess } from "@/lib/admin-access";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type AdminUserRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  role: "admin" | "user";
  providers: string[];
  joinedAt: string | null;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  onboardingStage: "pending" | "setup" | "complete";
  isDeactivated: boolean;
  isCurrentUser: boolean;
};

function normalizeRole(value: unknown): "admin" | "user" {
  return value === "admin" ? "admin" : "user";
}

function isToday(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  );
}

function isRecent(value: string | null, hours: number) {
  if (!value) return false;
  const threshold = Date.now() - hours * 60 * 60 * 1000;
  return new Date(value).getTime() >= threshold;
}

function getLatestIsoDate(values: Array<string | null | undefined>) {
  let latest: string | null = null;

  for (const value of values) {
    if (!value) continue;
    if (!latest || new Date(value).getTime() > new Date(latest).getTime()) {
      latest = value;
    }
  }

  return latest;
}

function getOnboardingStage(params: {
  fullName: string | null;
  onboardingCompleted: boolean;
  setupUpdatedAt: string | null;
}) {
  if (params.onboardingCompleted) {
    return "complete" as const;
  }

  if (params.setupUpdatedAt || params.fullName?.trim()) {
    return "setup" as const;
  }

  return "pending" as const;
}

export async function GET() {
  const unauthorized = await assertAdminAccess();
  if (unauthorized) return unauthorized;

  try {
    const admin = createSupabaseAdminClient();
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    const nowIso = new Date().toISOString();

    const [
      { data: authUsers, error: authUsersError },
      { data: profiles, error: profilesError },
      { data: officeSettings, error: officeSettingsError },
      { data: attendanceLogs, error: attendanceLogsError },
    ] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin
        .from("profiles")
        .select("id, full_name, onboarding_completed, role, email, is_deactivated, updated_at"),
      admin
        .from("office_settings")
        .select("user_id, updated_at"),
      admin
        .from("attendance_logs")
        .select("user_id, event_time")
        .lte("event_time", nowIso)
        .order("event_time", { ascending: false })
        .limit(5000),
    ]);

    if (authUsersError) throw authUsersError;
    if (profilesError) throw profilesError;
    if (officeSettingsError) throw officeSettingsError;
    if (attendanceLogsError) throw attendanceLogsError;

    const profileMap = new Map(
      (profiles ?? []).map((profile) => [
        profile.id,
        {
          fullName: profile.full_name,
          email: typeof profile.email === "string" ? profile.email : null,
          onboardingCompleted: Boolean(profile.onboarding_completed),
          role: normalizeRole(profile.role),
          isDeactivated: Boolean(profile.is_deactivated),
          updatedAt:
            "updated_at" in profile && typeof profile.updated_at === "string"
              ? profile.updated_at
              : null,
        },
      ]),
    );

    const setupMap = new Map(
      (officeSettings ?? []).map((settings) => [
        settings.user_id,
        "updated_at" in settings && typeof settings.updated_at === "string"
          ? settings.updated_at
          : null,
      ]),
    );

    const latestAttendanceMap = new Map<string, string>();

    for (const log of attendanceLogs ?? []) {
      if (!latestAttendanceMap.has(log.user_id)) {
        latestAttendanceMap.set(log.user_id, typeof log.event_time === "string" ? log.event_time : "");
      }
    }

    const rows: AdminUserRow[] = (authUsers.users ?? [])
      .map((user) => {
        const profile = profileMap.get(user.id);
        const setupUpdatedAt = setupMap.get(user.id) ?? null;
        const profileUpdatedAt = profile?.updatedAt ?? null;
        const lastActiveAt = getLatestIsoDate([
          latestAttendanceMap.get(user.id) ?? null,
          setupUpdatedAt,
          profileUpdatedAt,
        ]);
        const identities = user.identities?.map((identity) => identity.provider).filter(Boolean) ?? [];
        const providers = Array.from(new Set(identities.length ? identities : user.app_metadata?.providers ?? []));
        const isDeactivated =
          profile?.isDeactivated ||
          (typeof user.banned_until === "string" &&
            new Date(user.banned_until).getTime() > Date.now());

        return {
          id: user.id,
          fullName: profile?.fullName ?? user.user_metadata.full_name ?? null,
          email: profile?.email ?? user.email ?? null,
          role: normalizeRole(profile?.role),
          providers,
          joinedAt: user.created_at ?? null,
          lastLoginAt: user.last_sign_in_at ?? null,
          lastActiveAt,
          onboardingStage: getOnboardingStage({
            fullName: profile?.fullName ?? user.user_metadata.full_name ?? null,
            onboardingCompleted: profile?.onboardingCompleted ?? false,
            setupUpdatedAt,
          }),
          isDeactivated,
          isCurrentUser: currentUser?.id === user.id,
        };
      })
      .sort((left, right) => {
        const leftTime = left.joinedAt ? new Date(left.joinedAt).getTime() : 0;
        const rightTime = right.joinedAt ? new Date(right.joinedAt).getTime() : 0;
        return rightTime - leftTime;
      });

    return NextResponse.json({
      stats: {
        totalUsers: rows.length,
        admins: rows.filter((row) => row.role === "admin").length,
        activeUsers: rows.filter((row) => isRecent(row.lastActiveAt, 24)).length,
        deactivatedUsers: rows.filter((row) => row.isDeactivated).length,
      },
      rows,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
