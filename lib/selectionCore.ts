// Pure, DB-free selection logic — kept separate from lib/selection.ts so it
// can be unit tested without a database. lib/selection.ts fetches data and
// delegates the actual decisions to these functions.

// TODO(spec): weighting curve is a working default (implementation plan
// Phase 1 open items — "pick something defensible and flag it"). Revisit
// once real usage data exists (spec 5.8).
const QUALITY_WEIGHT_BASE = 1.5;
const DEFAULT_QUALITY_SCORE = 3; // null treated as baseline (spec 2.10)

export function qualityWeight(score: number | null): number {
  return Math.pow(QUALITY_WEIGHT_BASE, score ?? DEFAULT_QUALITY_SCORE);
}

// Weighted-random pick biased toward higher quality_score — weighted, not
// strictly ordered (spec 2.10: strict ordering would make the tail of a long
// session noticeably worse and obvious on "Another" spam). `random` is
// injectable so tests can be deterministic.
export function weightedPick<T extends { qualityScore: number | null }>(
  items: T[],
  random: () => number = Math.random
): T {
  if (items.length === 0) {
    throw new Error("weightedPick called with an empty list");
  }

  const weights = items.map((item) => qualityWeight(item.qualityScore));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = random() * total;

  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1]; // floating-point fallback
}

export function unseenFacts<T extends { id: string }>(facts: T[], seenFactIds: string[]): T[] {
  const seen = new Set(seenFactIds);
  return facts.filter((f) => !seen.has(f.id));
}

// Category IDs with at least one unseen fact — the Random eligibility pool
// (spec 4.1). Exhausted categories drop out; survivors absorb Random's share
// evenly since the caller picks uniformly among whatever this returns.
export function eligibleCategoryIds<T extends { id: string; categoryId: string }>(
  facts: T[],
  seenFactIds: string[]
): string[] {
  const unseen = unseenFacts(facts, seenFactIds);
  return [...new Set(unseen.map((f) => f.categoryId))];
}

// Removes exactly one category's fact IDs from a seen-list, nothing else
// (spec 4.3 per-category Reshuffle).
export function reshuffleCategory(seenFactIds: string[], categoryFactIds: string[]): string[] {
  const toRemove = new Set(categoryFactIds);
  return seenFactIds.filter((id) => !toRemove.has(id));
}
