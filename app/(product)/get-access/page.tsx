import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AuthClientOnly } from "../components/auth-client-only";

import { GetAccessForm } from "./get-access-form";

export default async function GetAccessPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthClientOnly>
      <GetAccessForm />
    </AuthClientOnly>
  );
}
