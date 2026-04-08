import { NextRequest, NextResponse } from "next/server";

import { assertAdminSession } from "@/lib/admin-session";
import { TABLES, supabaseRequest } from "@/lib/supabase-rest";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("attendance_logs")
        .delete()
        .eq("id", Number(id))
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    const unauthorized = await assertAdminSession();
    if (unauthorized) return unauthorized;

    await supabaseRequest(`${TABLES.logs}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
