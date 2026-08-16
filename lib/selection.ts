// Fact selection logic (spec 4.1). Kept in one module since it grows every
// phase. This file fetches data from Postgres and delegates the actual
// decisions to the pure, unit-tested functions in lib/selectionCore.ts.
import { prisma } from "@/lib/db";
import { unseenFacts, eligibleCategoryIds, weightedPick } from "@/lib/selectionCore";
import { SERVABLE_VERIFICATION_STATUSES } from "@/lib/verification";

export async function pickCategoryFact(categoryId: string, seenFactIds: string[]) {
  const facts = await prisma.fact.findMany({
    where: { categoryId, active: true, verificationStatus: { in: [...SERVABLE_VERIFICATION_STATUSES] } },
    include: { category: true },
  });

  const unseen = unseenFacts(facts, seenFactIds);
  if (unseen.length === 0) return null; // exhausted — caller shows the exhaustion state (spec 4.3)

  return weightedPick(unseen); // biased toward higher quality_score (spec 2.10)
}

export async function getEligibleCategoryIds(seenFactIds: string[]): Promise<string[]> {
  const facts = await prisma.fact.findMany({
    where: { active: true, verificationStatus: { in: [...SERVABLE_VERIFICATION_STATUSES] } },
    select: { id: true, categoryId: true },
  });
  return eligibleCategoryIds(facts, seenFactIds);
}

export async function pickRandomFact(seenFactIds: string[]) {
  const eligibleIds = await getEligibleCategoryIds(seenFactIds);
  if (eligibleIds.length === 0) return null; // global exhaustion (spec 4.3)

  // Even roll across eligible categories only — exhausted categories drop
  // out, survivors absorb the share evenly (spec 4.1).
  const categoryId = eligibleIds[Math.floor(Math.random() * eligibleIds.length)];
  return pickCategoryFact(categoryId, seenFactIds); // guaranteed to find an unseen fact
}
