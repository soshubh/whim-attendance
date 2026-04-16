import { NextRequest, NextResponse } from "next/server";

import { assertAdminAccess } from "@/lib/admin-access";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type Context = {
  params: Promise<{ id: string }>;
};

type UpdateBody = {
  role?: "admin" | "user";
  deactivated?: boolean;
};

export async function PATCH(request: NextRequest, context: Context) {
  const unauthorized = await assertAdminAccess();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as UpdateBody | null;

  if (!id || !body || (!("role" in body) && !("deactivated" in body))) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const admin = createSupabaseAdminClient();

  try {
    if (body.role) {
      if (!["admin", "user"].includes(body.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      if (currentUser?.id === id && body.role !== "admin") {
        return NextResponse.json(
          { error: "You cannot remove your own admin role." },
          { status: 400 },
        );
      }

      const { error: roleError } = await admin
        .from("profiles")
        .update({ role: body.role })
        .eq("id", id);

      if (roleError) {
        throw roleError;
      }
    }

    if (typeof body.deactivated === "boolean") {
      if (currentUser?.id === id && body.deactivated) {
        return NextResponse.json(
          { error: "You cannot deactivate your own account." },
          { status: 400 },
        );
      }

      const { error: authError } = await admin.auth.admin.updateUserById(id, {
        ban_duration: body.deactivated ? "876000h" : "none",
      });

      if (authError) {
        throw authError;
      }

      const { error: profileError } = await admin
        .from("profiles")
        .update({ is_deactivated: body.deactivated })
        .eq("id", id);

      if (profileError) {
        throw profileError;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
