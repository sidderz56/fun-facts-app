import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically once
// CRON_SECRET is set as a project env var — this is Vercel's own documented
// mechanism for authenticating cron-triggered requests, same shape as the
// bearer-token check on the internal draft-fact endpoint (Phase "next
// facts" work): a narrow-purpose secret, not the database connection
// string, so it's safe to be a plain env var.
export function authorizedCronRequest(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const auth = request.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
