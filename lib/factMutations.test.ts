import { describe, it, expect } from "vitest";
import { retireFact, restoreFact, editFactText } from "./factMutations";

// These three functions validate their `reason` argument synchronously
// before ever calling prisma.$transaction, so a missing reason rejects
// without touching the database — safe to test without a live DATABASE_URL.
// Full read-after-write behavior (revision row exists, fact row untouched)
// is verified manually against the dev database, matching how every other
// DB-touching path in this app has been tested.

describe("retireFact requires a non-empty reason (spec 3.5)", () => {
  const validParams = { actor: "founder", retiredReason: "became_false" as const };

  it("rejects an empty reason", async () => {
    await expect(retireFact("any-id", { ...validParams, reason: "" })).rejects.toThrow(/non-empty reason/);
  });

  it("rejects a whitespace-only reason", async () => {
    await expect(retireFact("any-id", { ...validParams, reason: "   " })).rejects.toThrow(/non-empty reason/);
  });
});

describe("restoreFact requires a non-empty reason (spec 3.5)", () => {
  it("rejects an empty reason", async () => {
    await expect(restoreFact("any-id", { reason: "", actor: "founder" })).rejects.toThrow(/non-empty reason/);
  });
});

describe("editFactText requires a non-empty reason (spec 3.5)", () => {
  it("rejects an empty reason", async () => {
    await expect(editFactText("any-id", "new text", { reason: "", actor: "founder" })).rejects.toThrow(
      /non-empty reason/
    );
  });
});
