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
    typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : null;

  const profilePayload: {
    id: string;
    updated_at: string;
    full_name?: string;
  } = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (fullName) {
    profilePayload.full_name = fullName;
  }

  await admin.from("profiles").upsert(profilePayload, { onConflict: "id" });
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
    redirect("/get-access");
  }

  return context as {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    user: User;
    profile: ProfileRecord | null;
  };
}

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/get-access");
  }

  return user;
}

export function generateShortcutToken() {
  return `usr_tok_${crypto.randomUUID().replace(/-/g, "")}`;
}

export async function ensureShortcutTokenForUser(userId: string) {
  const admin = createSupabaseAdminClient();

  const { data: existingToken, error: existingTokenError } = await admin
    .from("shortcut_tokens")
    .select("token, is_active")
    .eq("user_id", userId)
    .maybeSingle<ShortcutTokenRecord>();

  if (existingTokenError) {
    throw existingTokenError;
  }

  if (existingToken) {
    return existingToken;
  }

  const token = generateShortcutToken();

  const { data: createdToken, error: createdTokenError } = await admin
    .from("shortcut_tokens")
    .insert({
      user_id: userId,
      token,
      is_active: true,
    })
    .select("token, is_active")
    .single<ShortcutTokenRecord>();

  if (createdTokenError) {
    throw createdTokenError;
  }

  return createdToken;
}

export function isOnboardingComplete(params: {
  profile: ProfileRecord | null;
  shortcutToken: ShortcutTokenRecord | null;
}) {
  return Boolean(
    params.profile?.onboarding_completed &&
      params.shortcutToken,
  );
}
