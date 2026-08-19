import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSession } from "@/lib/session";
import { logEvent } from "@/lib/eventCapture";

// The one event (spec 5.8's "share initiated") that has no natural
// server-rendered request to hang off — Web Share API and clipboard-copy
// are pure client interactions that don't navigate anywhere. anon_id comes
// from the session cookie server-side, never from the request body, so a
// caller can't log an event against a different session.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const shareSlug = body?.shareSlug;
  const categorySlug = body?.categorySlug;

  if (typeof shareSlug !== "string" || typeof categorySlug !== "string") {
    return NextResponse.json({ error: "shareSlug and categorySlug required" }, { status: 400 });
  }

  const session = await getOrCreateSession();
  await logEvent({
    anonId: session.anonId,
    type: "share_initiated",
    shareSlug,
    categorySlug,
  });

  return NextResponse.json({ ok: true });
}
