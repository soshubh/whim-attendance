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

const SHORTCUT_TOKEN_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SHORTCUT_TOKEN_LENGTH = 8;

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
  const bytes = crypto.getRandomValues(new Uint8Array(SHORTCUT_TOKEN_LENGTH));

  return Array.from(bytes, (byte) =>
    SHORTCUT_TOKEN_ALPHABET[byte % SHORTCUT_TOKEN_ALPHABET.length] ?? "0",
  ).join("");
}

function isShortShortcutToken(token: string) {
  return token.length === SHORTCUT_TOKEN_LENGTH && /^[A-Za-z0-9]+$/.test(token);
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

  if (existingToken && isShortShortcutToken(existingToken.token)) {
    return existingToken;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = generateShortcutToken();
    const tokenPayload = {
      user_id: userId,
      token,
      is_active: existingToken?.is_active ?? true,
    };

    if (existingToken) {
      const { data: updatedToken, error: updatedTokenError } = await admin
        .from("shortcut_tokens")
        .update({
          token,
          is_active: existingToken.is_active,
        })
        .eq("user_id", userId)
        .select("token, is_active")
        .single<ShortcutTokenRecord>();

      if (!updatedTokenError) {
        return updatedToken;
      }

      if ((updatedTokenError as { code?: string }).code === "23505") {
        continue;
      }

      throw updatedTokenError;
    }

    const { data: createdToken, error: createdTokenError } = await admin
      .from("shortcut_tokens")
      .insert(tokenPayload)
      .select("token, is_active")
      .single<ShortcutTokenRecord>();

    if (!createdTokenError) {
      return createdToken;
    }

    if ((createdTokenError as { code?: string }).code === "23505") {
      continue;
    }

    throw createdTokenError;
  }

  throw new Error("Could not generate a unique shortcut token.");
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
