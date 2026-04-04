import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type ProfileRecord = {
  id: string;
  full_name: string | null;
  onboarding_completed: boolean;
};

export type OfficeSettingsRecord = {
  office_name: string | null;
  office_address: string | null;
  office_lat: number;
  office_lng: number;
  radius_meters: number;
  timezone: string;
};

export type ShortcutTokenRecord = {
  token: string;
  is_active: boolean;
};

export async function ensureProfileForUser(user: User) {
  const admin = createSupabaseAdminClient();
  const fullName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
}

export async function getAuthenticatedContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  await ensureProfileForUser(user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle<ProfileRecord>();

  return {
    supabase,
    user,
    profile,
  };
}

export async function requireAuthenticatedContext() {
  const context = await getAuthenticatedContext();

  if (!context.user) {
    redirect("/login");
  }

  return context as {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    user: User;
    profile: ProfileRecord | null;
  };
}

export function generateShortcutToken() {
  return `usr_tok_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function isOnboardingComplete(params: {
  profile: ProfileRecord | null;
  officeSettings: OfficeSettingsRecord | null;
  shortcutToken: ShortcutTokenRecord | null;
}) {
  return Boolean(
    params.profile?.onboarding_completed &&
      params.officeSettings &&
      params.shortcutToken,
  );
}
