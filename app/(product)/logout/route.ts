import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const target = new URL("/get-access", request.url);
  const message = request.nextUrl.searchParams.get("message");

  if (message) {
    target.searchParams.set("message", message);
  }

  return NextResponse.redirect(target);
}
