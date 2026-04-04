import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const redirectPath = next.startsWith("/") ? next : "/dashboard";

  try {
    const supabase = await createSupabaseServerClient();
    const code = requestUrl.searchParams.get("code");
    const tokenHash = requestUrl.searchParams.get("token_hash");
    const type = requestUrl.searchParams.get("type");

    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    } else if (tokenHash && type) {
      await supabase.auth.verifyOtp({
        type: type as EmailOtpType,
        token_hash: tokenHash,
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await ensureProfileForUser(user);
    }

    return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
  } catch {
    return NextResponse.redirect(
      new URL(
        "/login?message=We%20could%20not%20complete%20that%20email%20action.%20Please%20try%20again.",
        requestUrl.origin,
      ),
    );
  }
}
