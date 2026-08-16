import { describe, it, expect } from "vitest";
import {
  validateSources,
  validateLength,
  validateStaleness,
  computeReverificationDueDate,
  canReachVerified,
  type Source,
} from "./verification";

const primary: Source = { url: "https://example.gov/x", name: "Example Gov", accessedDate: "2026-01-01", tier: "primary" };
const secondary: Source = { url: "https://example.com/x", name: "Example", accessedDate: "2026-01-01", tier: "secondary" };

describe("validateSources (spec 2.4)", () => {
  it("rejects zero sources", () => {
    expect(validateSources([], null).ok).toBe(false);
  });

  it("rejects two secondary sources with no primary", () => {
    expect(validateSources([secondary, secondary], null).ok).toBe(false);
  });

  it("accepts two sources with at least one primary", () => {
    expect(validateSources([primary, secondary], null).ok).toBe(true);
  });

  it("rejects a single secondary source even with a note (secondary can't use the exception)", () => {
    expect(validateSources([secondary], "official record body").ok).toBe(false);
  });

  it("rejects a single primary source with no verification_note", () => {
    expect(validateSources([primary], null).ok).toBe(false);
    expect(validateSources([primary], "").ok).toBe(false);
    expect(validateSources([primary], "   ").ok).toBe(false);
  });

  it("accepts the single-source exception: one primary source plus a note", () => {
    expect(validateSources([primary], "Official record body for its own record.").ok).toBe(true);
  });
});

describe("validateLength (spec 2.9)", () => {
  it("accepts anything <= 50 words with no note required", () => {
    expect(validateLength(20, null).ok).toBe(true);
    expect(validateLength(50, null).ok).toBe(true);
  });

  it("requires a verification_note for 51-75 words", () => {
    expect(validateLength(60, null).ok).toBe(false);
    expect(validateLength(60, "").ok).toBe(false);
    expect(validateLength(60, "reviewer override: extra context needed").ok).toBe(true);
  });

  it("hard-rejects anything over 75 words regardless of note", () => {
    expect(validateLength(80, "even with a note").ok).toBe(false);
  });

  it("boundary: exactly 75 words is acceptable with a note, 76 is not", () => {
    expect(validateLength(75, "note").ok).toBe(true);
    expect(validateLength(76, "note").ok).toBe(false);
  });
});

describe("validateStaleness (spec 2.5)", () => {
  it("is fine when not time_sensitive, regardless of cadence", () => {
    expect(validateStaleness(false, null, null).ok).toBe(true);
  });

  it("rejects time_sensitive with no cadence", () => {
    expect(validateStaleness(true, null, null).ok).toBe(false);
    expect(validateStaleness(true, "none", null).ok).toBe(false);
  });

  it("accepts time_sensitive with a real cadence", () => {
    expect(validateStaleness(true, "annual", null).ok).toBe(true);
  });

  it("requires an explicit due date for cadence 'custom'", () => {
    expect(validateStaleness(true, "custom", null).ok).toBe(false);
    expect(validateStaleness(true, "custom", new Date("2027-01-01")).ok).toBe(true);
  });
});

describe("computeReverificationDueDate (spec 2.5)", () => {
  it("returns null for cadence 'none'", () => {
    expect(computeReverificationDueDate("none", new Date("2026-01-01"), null)).toBeNull();
  });

  it("uses the explicit date for cadence 'custom'", () => {
    const explicit = new Date("2027-06-15");
    expect(computeReverificationDueDate("custom", new Date("2026-01-01"), explicit)).toBe(explicit);
  });

  it("adds the right number of months for each fixed cadence", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    expect(computeReverificationDueDate("quarterly", start, null)?.toISOString()).toBe("2026-04-15T00:00:00.000Z");
    expect(computeReverificationDueDate("semiannual", start, null)?.toISOString()).toBe("2026-07-15T00:00:00.000Z");
    expect(computeReverificationDueDate("annual", start, null)?.toISOString()).toBe("2027-01-15T00:00:00.000Z");
    expect(computeReverificationDueDate("biennial", start, null)?.toISOString()).toBe("2028-01-15T00:00:00.000Z");
  });
});

describe("canReachVerified (combined gate, spec 2.4/2.5/2.9)", () => {
  const validBase = {
    sources: [primary, secondary],
    verificationNote: null,
    wordCount: 25,
    timeSensitive: false,
    reverificationCadence: null,
    reverificationDueDate: null,
  };

  it("accepts a fully valid fact", () => {
    expect(canReachVerified(validBase).ok).toBe(true);
  });

  it("collects every failing reason, not just the first", () => {
    const result = canReachVerified({
      ...validBase,
      sources: [secondary], // fails: single source not primary
      wordCount: 90, // fails: over hard limit
      timeSensitive: true,
      reverificationCadence: null, // fails: time_sensitive with no cadence
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reasons).toHaveLength(3);
    }
  });

  it("a fact with one secondary source cannot reach verified", () => {
    // Direct check against the plan's own acceptance criterion wording.
    const result = canReachVerified({ ...validBase, sources: [secondary] });
    expect(result.ok).toBe(false);
  });

  it("an 80-word fact cannot reach verified", () => {
    const result = canReachVerified({ ...validBase, wordCount: 80 });
    expect(result.ok).toBe(false);
  });
});
