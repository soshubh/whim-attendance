import { NextResponse } from "next/server";

import { hasAdminAccess } from "@/lib/admin-access";

export async function GET() {
  return NextResponse.json({ authenticated: await hasAdminAccess() });
}
