import { NextResponse } from "next/server";

import { type ProfileRecord, ensureProfileForUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export function isAdminRole(role: ProfileRecord["role"] | string | null | undefined) {
  return (role ?? "").trim().toLowerCase() === "admin";
}

export function isAdminProfile(profile: Pick<ProfileRecord, "role"> | null | undefined) {
  return isAdminRole(profile?.role);
}

export async function getCurrentUserAdminAccess() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, isAdmin: false };
  }

  await ensureProfileForUser(user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, onboarding_completed, role, is_deactivated")
    .eq("id", user.id)
    .maybeSingle<ProfileRecord>();

  return {
    user,
    profile,
    isAdmin: isAdminProfile(profile),
  };
}

export async function hasAdminAccess() {
  const { isAdmin } = await getCurrentUserAdminAccess();
  return isAdmin;
}

export async function assertAdminAccess() {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
