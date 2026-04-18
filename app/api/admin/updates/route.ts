import { NextResponse } from "next/server";

import { assertAdminAccess } from "@/lib/admin-access";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { PostgrestError } from "@supabase/supabase-js";

type ProductUpdateRow = {
  id: string;
  meta: string;
  title: string;
  copy: string;
  publishedAt: string | null;
  createdAt: string;
};

function normalizeUpdate(row: {
  id: string;
  meta: string;
  title: string;
  copy: string;
  published_at: string | null;
  created_at: string;
}): ProductUpdateRow {
  return {
    id: row.id,
    meta: row.meta,
    title: row.title,
    copy: row.copy,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

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

export async function GET() {
  const unauthorized = await assertAdminAccess();
  if (unauthorized) return unauthorized;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("product_updates")
      .select("id, meta, title, copy, published_at, created_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      rows: (data ?? []).map(normalizeUpdate),
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await assertAdminAccess();
  if (unauthorized) return unauthorized;

  try {
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
      .insert({
        meta,
        title,
        copy,
        published_at: publish ? new Date().toISOString() : null,
      })
      .select("id, meta, title, copy, published_at, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ row: normalizeUpdate(data) });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
