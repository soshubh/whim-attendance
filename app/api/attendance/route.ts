import { NextRequest, NextResponse } from "next/server";

import { assertAdminSession } from "@/lib/admin-session";
import { COLUMNS, TABLES, supabaseRequest } from "@/lib/supabase-rest";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function getMonthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const monthKey = request.nextUrl.searchParams.get("month");

  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { start, end } = getMonthRange(monthKey);

  const { data, error } = await supabase
    .from("attendance_logs")
    .select("id, event_type, event_time, leave_category, event_label")
    .eq("user_id", user.id)
    .gte("event_time", start)
    .lt("event_time", end)
    .order("event_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.eventType !== "string" || typeof body.eventTime !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!["IN", "OUT", "LEAVE", "WFH"].includes(body.eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const insertPayload = {
        user_id: user.id,
        event_type: body.eventType,
        event_time: body.eventTime,
        leave_category:
          body.eventType === "LEAVE" && typeof body.leaveCategory === "string"
            ? body.leaveCategory
            : null,
        event_label: typeof body.eventLabel === "string" && body.eventLabel.trim()
          ? body.eventLabel.trim()
          : null,
      };

      const { data, error } = await supabase
        .from("attendance_logs")
        .insert(insertPayload)
        .select("id, event_type, event_time, leave_category, event_label")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ log: data });
    }

    const unauthorized = await assertAdminSession();
    if (unauthorized) return unauthorized;

    const inserted = await supabaseRequest(`${TABLES.logs}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        [COLUMNS.eventTime]: body.eventTime,
        [COLUMNS.eventType]: body.eventType,
        [COLUMNS.leaveCategory]:
          body.eventType === "LEAVE" && typeof body.leaveCategory === "string"
            ? body.leaveCategory
            : null,
        [COLUMNS.eventLabel]:
          typeof body.eventLabel === "string" && body.eventLabel.trim()
            ? body.eventLabel.trim()
            : null,
      }),
    });

    return NextResponse.json(inserted);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
