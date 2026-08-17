// The two lists spec 5.7 defines for the admin dashboard. Read-only —
// mutations live in lib/adminActions.ts (Server Actions) which call into
// lib/factMutations.ts / lib/reporting.ts.
import { prisma } from "@/lib/db";

// spec 5.7 list 1: "time_sensitive = true AND reverification_due_date in
// the past (computed from cadence, or explicit for custom)." Scoped to
// active facts — a retired fact re-verifying itself isn't a meaningful
// dashboard entry.
export async function getReverificationQueue() {
  return prisma.fact.findMany({
    where: {
      timeSensitive: true,
      reverificationDueDate: { lt: new Date() },
      active: true,
    },
    include: { category: true },
    orderBy: { reverificationDueDate: "asc" },
  });
}

// spec 5.7 list 2: "facts with unresolved reports, sorted by count
// descending, with auto-pulled facts... surfaced at the top." Auto-pulled
// is identified the same way lib/reporting.ts's submitReport checks before
// calling autoPullFact: active = false AND retired_reason IS NULL — the one
// state a founder-driven retirement can never produce (retireFact always
// sets a retired_reason), so it's an unambiguous marker with no extra
// column needed.
export async function getReportQueue() {
  const facts = await prisma.fact.findMany({
    where: { reportsSinceReview: { gt: 0 } },
    include: { category: true },
  });

  return facts.sort((a, b) => {
    const aAutoPulled = !a.active && a.retiredReason === null;
    const bAutoPulled = !b.active && b.retiredReason === null;
    if (aAutoPulled !== bAutoPulled) return aAutoPulled ? -1 : 1;
    return b.reportsSinceReview - a.reportsSinceReview;
  });
}
