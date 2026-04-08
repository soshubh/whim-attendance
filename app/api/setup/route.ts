import { NextResponse } from "next/server";

import { generateShortcutToken } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ExistingOfficeSettings = {
  office_name: string | null;
  office_address: string | null;
  office_lat: number;
  office_lng: number;
  radius_meters: number;
  timezone: string;
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        fullName?: string;
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = body.fullName?.trim() ?? "";

  if (!fullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: existingOfficeSettings } = await admin
    .from("office_settings")
    .select("office_name, office_address, office_lat, office_lng, radius_meters, timezone")
    .eq("user_id", user.id)
    .maybeSingle<ExistingOfficeSettings>();

  const { data: existingToken } = await admin
    .from("shortcut_tokens")
    .select("token")
    .eq("user_id", user.id)
    .maybeSingle<{ token: string }>();

  const token = existingToken?.token ?? generateShortcutToken();

  const profileResult = await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      onboarding_completed: true,
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (profileResult.error) {
    return NextResponse.json({ error: profileResult.error.message }, { status: 500 });
  }

  const officeResult = await admin.from("office_settings").upsert(
    {
      user_id: user.id,
      office_name: existingOfficeSettings?.office_name ?? null,
      office_address: existingOfficeSettings?.office_address ?? null,
      office_lat: existingOfficeSettings?.office_lat ?? 0,
      office_lng: existingOfficeSettings?.office_lng ?? 0,
      radius_meters: existingOfficeSettings?.radius_meters ?? 300,
      timezone: existingOfficeSettings?.timezone ?? "Asia/Kolkata",
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  if (officeResult.error) {
    return NextResponse.json({ error: officeResult.error.message }, { status: 500 });
  }

  if (!existingToken) {
    const tokenResult = await admin.from("shortcut_tokens").insert({
      user_id: user.id,
      token,
      is_active: true,
    });

    if (tokenResult.error) {
      return NextResponse.json({ error: tokenResult.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, token });
}
