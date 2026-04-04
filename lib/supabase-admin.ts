import { createClient } from "@supabase/supabase-js";

import { getEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const env = getEnv();

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
