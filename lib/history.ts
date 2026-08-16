// "This day in history" DB integration (spec 3.4). Fetches data and
// delegates the actual decision to the pure, unit-tested functions in
// lib/historyCore.ts.
import { prisma } from "@/lib/db";
import { getMonthDay, pickHistoryEntry } from "@/lib/historyCore";
import { SERVABLE_VERIFICATION_STATUSES } from "@/lib/verification";

export async function getTodayHistoryEntry() {
  const monthDay = getMonthDay();
  const candidates = await prisma.thisDayInHistory.findMany({
    where: { monthDay, active: true, verificationStatus: { in: [...SERVABLE_VERIFICATION_STATUSES] } },
  });
  return pickHistoryEntry(candidates);
}

// Called when a history entry is actually displayed to a user — updates
// date_last_shown so next year's rotation moves on to another candidate.
// Safe to call more than once on the same UTC day (idempotent in effect).
export async function markHistoryEntryShown(id: string) {
  await prisma.thisDayInHistory.update({
    where: { id },
    data: { dateLastShown: new Date() },
  });
}
