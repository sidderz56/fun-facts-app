import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizedCronRequest } from "@/lib/cronAuth";

// spec 3.3: "prune session records with last_active_at older than 12
// months. This bounds table growth, and a returning user after a year
// seeing a repeated fact is an acceptable outcome." Scheduled via
// vercel.json (weekly — session churn is slow, no need for daily runs).
//
// Only prunes sessions with zero related Report or Event rows: both those
// tables have an ON DELETE RESTRICT foreign key to sessions.anon_id (by
// design — a report shouldn't silently vanish just because the reporting
// session aged out, spec 3.5's audit-trail spirit extends to it even
// though reports aren't formally in that table). A session old enough to
// prune but with report/event history attached is left alone; at this
// traffic scale that's a small minority of the >12-month-old rows, not
// the bulk of what's actually growing the table.
export async function GET(request: NextRequest) {
  if (!authorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const candidates = await prisma.session.findMany({
    where: {
      lastActiveAt: { lt: cutoff },
      reports: { none: {} },
      events: { none: {} },
    },
    select: { anonId: true },
  });

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, pruned: 0 });
  }

  const { count } = await prisma.session.deleteMany({
    where: { anonId: { in: candidates.map((c) => c.anonId) } },
  });

  return NextResponse.json({ ok: true, pruned: count });
}
