import { NextResponse } from "next/server";

import { isAdminProfile } from "@/lib/admin-access";
import {
  ensureProfileForUser,
  isOnboardingComplete,
  type ProfileRecord,
  type ShortcutTokenRecord,
} from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureProfileForUser(user);

  const [{ data: profile }, { data: shortcutToken }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, onboarding_completed, role, is_deactivated")
      .eq("id", user.id)
      .maybeSingle<ProfileRecord>(),
    supabase
      .from("shortcut_tokens")
      .select("token, is_active")
      .eq("user_id", user.id)
      .maybeSingle<ShortcutTokenRecord>(),
  ]);

  if (profile?.is_deactivated) {
    return NextResponse.json(
      { error: "Your account has been disabled from the admin side." },
      { status: 403 },
    );
  }

  if (isAdminProfile(profile)) {
    return NextResponse.json({ next: "admin" });
  }

  if (!profile?.full_name?.trim()) {
    return NextResponse.json({ next: "name" });
  }

  return NextResponse.json({
    next: isOnboardingComplete({ profile, shortcutToken }) ? "dashboard" : "setup",
  });
}
