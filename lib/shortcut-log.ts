import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type ShortcutRequestBody = {
  token?: string;
  event?: string;
  timestamp?: string;
};

export function normalizeShortcutEventType(value: string | null | undefined) {
  if (!value) return null;
  const nextValue = value.toUpperCase();
  return nextValue === "IN" || nextValue === "OUT" ? nextValue : null;
}

export function getShortcutInfoResponse(token: string, eventType: "IN" | "OUT") {
  return NextResponse.json({
    ok: true,
    method: "POST",
    token,
    event_type: eventType,
    message:
      "Use this URL from iPhone Shortcut with a POST request. No headers or JSON body are required.",
  });
}

export async function handleShortcutLogRequest(params: {
  token: string;
  eventType: "IN" | "OUT";
  body: ShortcutRequestBody | null;
}) {
  const { token, eventType, body } = params;
  const admin = createSupabaseAdminClient();

  const { data: tokenRecord, error: tokenError } = await admin
    .from("shortcut_tokens")
    .select("user_id, is_active")
    .eq("token", token)
    .maybeSingle<{ user_id: string; is_active: boolean }>();

  if (tokenError) {
    return NextResponse.json({ error: tokenError.message }, { status: 500 });
  }

  if (!tokenRecord?.is_active) {
    return NextResponse.json({ error: "Shortcut token is invalid." }, { status: 401 });
  }

  const eventTime = body?.timestamp ? new Date(body.timestamp) : new Date();
  if (Number.isNaN(eventTime.getTime())) {
    return NextResponse.json({ error: "timestamp is invalid." }, { status: 400 });
  }

  const { error: insertError } = await admin.from("attendance_logs").insert({
    user_id: tokenRecord.user_id,
    event_type: eventType,
    event_time: eventTime.toISOString(),
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    accepted: true,
    event_type: eventType,
  });
}
