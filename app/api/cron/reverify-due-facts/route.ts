import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizedCronRequest } from "@/lib/cronAuth";
import { flagDueForReverification } from "@/lib/factMutations";

// "Re-verification job — populates the dashboard queue on schedule" (plan
// Phase 8). The dashboard's own query (lib/adminQueries.ts) already finds
// due facts live by comparing reverification_due_date to now — this job
// doesn't feed that query data it couldn't otherwise see. What it adds is
// making verification_status itself reflect "this is due" (verified ->
// needs_reverification) rather than silently staying `verified` forever
// past its due date, so the fact's own record is accurate everywhere it's
// read, not just in that one dashboard query. Scheduled daily via
// vercel.json.
export async function GET(request: NextRequest) {
  if (!authorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await prisma.fact.findMany({
    where: {
      active: true,
      timeSensitive: true,
      verificationStatus: "verified",
      reverificationDueDate: { lt: new Date() },
    },
    select: { id: true },
  });

  for (const fact of due) {
    await flagDueForReverification(fact.id);
  }

  return NextResponse.json({ ok: true, flagged: due.length });
}
