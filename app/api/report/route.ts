import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSession } from "@/lib/session";
import { submitReport } from "@/lib/reporting";

// spec 5.3: "consistent with the zero-typing principle it requires zero
// typing: one tap creates a report row — no reason field, no form." A POST
// JSON API rather than the GET-redirect pattern used by next-fact/reshuffle,
// since this doesn't navigate anywhere — it's a background call from a
// button that stays on the same fact-view screen.
function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const factId = body?.factId;
  if (typeof factId !== "string" || factId.length === 0) {
    return NextResponse.json({ error: "factId required" }, { status: 400 });
  }

  const session = await getOrCreateSession();
  await submitReport(factId, session.anonId, clientIp(request));

  // Always ok, whether or not it was actually recorded — spec 5.3: repeat
  // taps and rate-limited taps are "silently accepted in the UI but not
  // recorded." The response can't tell the caller which happened.
  return NextResponse.json({ ok: true });
}
