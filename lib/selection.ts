// Fact selection logic (spec 4.1). Kept in one module since it grows every
// phase — Phase 1 adds Random eligibility filtering and quality-score
// weighting, Phase 4 adds the verified/active guard as an enforced query
// condition rather than a hardcoded literal.
import { prisma } from "@/lib/db";

export async function pickCategoryFact(categoryId: string, seenFactIds: string[]) {
  const unseen = await prisma.fact.findMany({
    where: {
      categoryId,
      active: true,
      verificationStatus: "verified",
      id: { notIn: seenFactIds },
    },
    include: { category: true },
  });

  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }

  // Phase 0 crash-free exhaustion stub (plan Phase 0: "if no unseen fact
  // exists, serve any fact from the category and log a warning"). Phase 1
  // replaces this with the real per-category exhaustion UI (spec 4.3).
  const anyFacts = await prisma.fact.findMany({
    where: { categoryId, active: true, verificationStatus: "verified" },
    include: { category: true },
  });

  if (anyFacts.length === 0) {
    return null; // category has no facts at all — shouldn't happen once seeded
  }

  console.warn(`[selection] category ${categoryId} exhausted for this session; serving a repeat (TODO phase1)`);
  return anyFacts[Math.floor(Math.random() * anyFacts.length)];
}

export async function pickRandomFact(seenFactIds: string[]) {
  const categories = await prisma.category.findMany({ select: { id: true } });
  if (categories.length === 0) return null;

  // Naive even roll across ALL categories (Phase 0 plan: "Eligibility
  // filtering comes in Phase 1 — a naive roll is fine here"). This can hand
  // back an already-exhausted category; the per-category stub above still
  // keeps it crash-free.
  const category = categories[Math.floor(Math.random() * categories.length)];
  return pickCategoryFact(category.id, seenFactIds);
}
