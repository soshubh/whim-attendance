function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnv() {
  return {
    appUrl: requireEnv("NEXT_PUBLIC_APP_URL"),
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabasePublishableKey: requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    adminPin: process.env.ADMIN_PIN ?? "",
    adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? "",
  };
}
