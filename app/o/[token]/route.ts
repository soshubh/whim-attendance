import { NextResponse } from "next/server";

import {
  getShortcutInfoResponse,
  handleShortcutLogRequest,
} from "@/lib/shortcut-log";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  if (!token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  return getShortcutInfoResponse(token, "OUT");
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    timestamp?: string;
  } | null;

  if (!token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  return handleShortcutLogRequest({
    token,
    eventType: "OUT",
    body,
  });
}
