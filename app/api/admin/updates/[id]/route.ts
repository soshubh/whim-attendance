import { NextResponse } from "next/server";

import { assertAdminAccess } from "@/lib/admin-access";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { PostgrestError } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getErrorMessage(error: unknown) {
  if (!error) return "Unknown error";

  if (typeof error === "object" && error !== null) {
    const postgrest = error as Partial<PostgrestError> & { message?: unknown };

    if (typeof postgrest.message === "string" && postgrest.message.trim()) {
      return postgrest.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown error";
}

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await assertAdminAccess();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          meta?: string;
          title?: string;
          copy?: string;
          publish?: boolean;
        }
      | null;

    const meta = body?.meta?.trim();
    const title = body?.title?.trim();
    const copy = body?.copy?.trim();
    const publish = body?.publish !== false;

    if (!meta || !title || !copy) {
      return NextResponse.json(
        { error: "Meta, title, and copy are required." },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("product_updates")
      .update({
        meta,
        title,
        copy,
        published_at: publish ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select("id, meta, title, copy, published_at, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      row: {
        id: data.id,
        meta: data.meta,
        title: data.title,
        copy: data.copy,
        publishedAt: data.published_at,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await assertAdminAccess();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("product_updates").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
