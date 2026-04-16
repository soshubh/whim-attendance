import { redirect } from "next/navigation";

import { ensureProfileForUser, DEACTIVATED_ACCOUNT_MESSAGE } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AuthClientOnly } from "../components/auth-client-only";

import { GetAccessForm } from "./get-access-form";

export default async function GetAccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureProfileForUser(user);
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_deactivated")
      .eq("id", user.id)
      .maybeSingle<{ is_deactivated: boolean }>();

    if (profile?.is_deactivated) {
      redirect(`/logout?message=${encodeURIComponent(DEACTIVATED_ACCOUNT_MESSAGE)}`);
    }

    redirect("/attendance");
  }

  const resolvedSearchParams = await searchParams;
  const message = resolvedSearchParams?.message?.trim() ?? "";

  return (
    <AuthClientOnly>
      <GetAccessForm initialMessage={message} />
    </AuthClientOnly>
  );
}
