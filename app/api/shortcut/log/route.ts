import { NextResponse } from "next/server";

import {
  getShortcutInfoResponse,
  handleShortcutLogRequest,
  normalizeShortcutEventType,
} from "@/lib/shortcut-log";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token") ?? "";
  const eventType = normalizeShortcutEventType(requestUrl.searchParams.get("event"));

  if (!token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  if (!eventType) {
    return NextResponse.json({ error: "event must be IN or OUT." }, { status: 400 });
  }

  return getShortcutInfoResponse(token, eventType);
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const body = (await request.json().catch(() => null)) as {
    token?: string;
    event?: string;
    timestamp?: string;
  } | null;
  const token = requestUrl.searchParams.get("token") ?? body?.token ?? "";
  const eventType = normalizeShortcutEventType(
    requestUrl.searchParams.get("event") ?? body?.event,
  );

  if (!token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  if (!eventType) {
    return NextResponse.json({ error: "event must be IN or OUT." }, { status: 400 });
  }

  return handleShortcutLogRequest({
    token,
    eventType,
    body,
  });
}
