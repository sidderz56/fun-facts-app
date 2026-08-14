import { describe, it, expect } from "vitest";
import {
  qualityWeight,
  weightedPick,
  unseenFacts,
  eligibleCategoryIds,
  reshuffleCategory,
} from "./selectionCore";

describe("unseenFacts (no-repeat)", () => {
  const facts = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("excludes facts already in the seen list", () => {
    expect(unseenFacts(facts, ["a"])).toEqual([{ id: "b" }, { id: "c" }]);
  });

  it("returns everything when nothing has been seen", () => {
    expect(unseenFacts(facts, [])).toEqual(facts);
  });

  it("returns nothing once every fact has been seen (per-category exhaustion)", () => {
    expect(unseenFacts(facts, ["a", "b", "c"])).toEqual([]);
  });
});

describe("eligibleCategoryIds (Random eligibility, spec 4.1)", () => {
  const facts = [
    { id: "h1", categoryId: "history" },
    { id: "h2", categoryId: "history" },
    { id: "s1", categoryId: "science" },
  ];

  it("includes only categories with at least one unseen fact", () => {
    // history exhausted, science still has an unseen fact
    const eligible = eligibleCategoryIds(facts, ["h1", "h2"]);
    expect(eligible).toEqual(["science"]);
  });

  it("includes all categories when nothing has been seen", () => {
    const eligible = eligibleCategoryIds(facts, []);
    expect(new Set(eligible)).toEqual(new Set(["history", "science"]));
  });

  it("is empty once every category is exhausted (global exhaustion)", () => {
    const eligible = eligibleCategoryIds(facts, ["h1", "h2", "s1"]);
    expect(eligible).toEqual([]);
  });

  it("never includes a category with zero unseen facts, even with a skewed seen-list", () => {
    // regression guard: a category should drop out the instant its last
    // fact is seen, not linger because of how ids happen to be ordered
    const eligible = eligibleCategoryIds(facts, ["h2", "h1"]);
    expect(eligible).not.toContain("history");
  });
});

describe("reshuffleCategory (spec 4.3 per-category Reshuffle)", () => {
  it("removes only the given category's fact ids", () => {
    const seen = ["h1", "h2", "s1", "s2"];
    const result = reshuffleCategory(seen, ["h1", "h2"]);
    expect(result).toEqual(["s1", "s2"]);
  });

  it("leaves other categories' seen state completely untouched", () => {
    const seen = ["s1", "s2", "g1"];
    const result = reshuffleCategory(seen, ["h1", "h2"]); // history ids not present
    expect(result).toEqual(seen);
  });

  it("results in an empty list when reshuffling the only seen category", () => {
    const seen = ["h1", "h2"];
    const result = reshuffleCategory(seen, ["h1", "h2"]);
    expect(result).toEqual([]);
  });
});

describe("qualityWeight (spec 2.10)", () => {
  it("treats null as the baseline score of 3", () => {
    expect(qualityWeight(null)).toBe(qualityWeight(3));
  });

  it("is monotonically increasing with score", () => {
    const weights = [1, 2, 3, 4, 5].map(qualityWeight);
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]).toBeGreaterThan(weights[i - 1]);
    }
  });
});

describe("weightedPick (spec 2.10)", () => {
  it("throws on an empty list rather than silently returning undefined", () => {
    expect(() => weightedPick([])).toThrow();
  });

  it("returns the only item when there's just one candidate", () => {
    const only = { id: "x", qualityScore: 1 };
    expect(weightedPick([only])).toBe(only);
  });

  it("is deterministic for an injected random function: r=0 picks the first item", () => {
    const items = [
      { id: "a", qualityScore: 3 },
      { id: "b", qualityScore: 3 },
    ];
    expect(weightedPick(items, () => 0).id).toBe("a");
  });

  it("is deterministic for an injected random function: r just under 1 picks the last item", () => {
    const items = [
      { id: "a", qualityScore: 3 },
      { id: "b", qualityScore: 3 },
    ];
    expect(weightedPick(items, () => 0.999999).id).toBe("b");
  });

  it("is weighted, not strict: a score-1 item can still be picked", () => {
    const items = [
      { id: "low", qualityScore: 1 },
      { id: "high", qualityScore: 5 },
    ];
    // r=0 always lands in the first bucket regardless of weight size, so
    // this proves the low-scored item retains non-zero probability mass
    // rather than being excluded outright.
    expect(weightedPick(items, () => 0).id).toBe("low");
  });

  it("biases selection toward higher quality_score over many draws", () => {
    const items = [
      { id: "low", qualityScore: 1 },
      { id: "high", qualityScore: 5 },
    ];
    let highCount = 0;
    const trials = 5000;
    for (let i = 0; i < trials; i++) {
      if (weightedPick(items).id === "high") highCount++;
    }
    // score 5 vs score 1 at base 1.5 => high should win roughly 5x as often
    // (weight ratio 7.59:1.5 ≈ 83%); assert it clearly dominates without
    // pinning an exact ratio, to avoid a flaky test.
    expect(highCount / trials).toBeGreaterThan(0.7);
    expect(highCount / trials).toBeLessThan(0.95);
  });
});
