import { describe, it, expect } from "vitest";
import { getMonthDay, pickHistoryEntry, isFirstVisitToday } from "./historyCore";

describe("getMonthDay", () => {
  it("formats as zero-padded MM-DD", () => {
    expect(getMonthDay(new Date("2026-01-05T12:00:00Z"))).toBe("01-05");
    expect(getMonthDay(new Date("2026-12-25T12:00:00Z"))).toBe("12-25");
  });

  it("handles Feb 29 on a leap year", () => {
    expect(getMonthDay(new Date("2028-02-29T00:00:00Z"))).toBe("02-29");
  });
});

describe("pickHistoryEntry (spec 3.4 rotation)", () => {
  it("returns null for an empty candidate list", () => {
    expect(pickHistoryEntry([])).toBeNull();
  });

  it("returns the only candidate when there's just one", () => {
    const only = { id: "a", dateLastShown: null, qualityScore: null };
    expect(pickHistoryEntry([only])).toBe(only);
  });

  it("prefers a candidate that has never been shown (null) over one that has", () => {
    const shown = { id: "shown", dateLastShown: new Date("2025-01-01"), qualityScore: 3 };
    const neverShown = { id: "never", dateLastShown: null, qualityScore: 3 };
    expect(pickHistoryEntry([shown, neverShown])?.id).toBe("never");
  });

  it("prefers the candidate with the older date_last_shown", () => {
    const older = { id: "older", dateLastShown: new Date("2024-01-01"), qualityScore: 3 };
    const newer = { id: "newer", dateLastShown: new Date("2025-01-01"), qualityScore: 3 };
    expect(pickHistoryEntry([older, newer])?.id).toBe("older");
  });

  it("breaks a tie on date_last_shown by highest quality_score", () => {
    const sameDate = new Date("2025-01-01");
    const low = { id: "low", dateLastShown: sameDate, qualityScore: 2 };
    const high = { id: "high", dateLastShown: sameDate, qualityScore: 5 };
    expect(pickHistoryEntry([low, high])?.id).toBe("high");
  });

  it("treats null quality_score as baseline 3 when tie-breaking", () => {
    const sameDate = new Date("2025-01-01");
    const nullScore = { id: "null-score", dateLastShown: sameDate, qualityScore: null };
    const belowBaseline = { id: "below", dateLastShown: sameDate, qualityScore: 2 };
    expect(pickHistoryEntry([nullScore, belowBaseline])?.id).toBe("null-score");
  });

  it("alternates a two-candidate date across consecutive simulated years", () => {
    // Year 1: neither has been shown -> A wins tie (equal quality_score,
    // both null date_last_shown), matching Array.sort's stable ordering.
    const a = { id: "a", dateLastShown: null as Date | null, qualityScore: 3 };
    const b = { id: "b", dateLastShown: null as Date | null, qualityScore: 3 };

    const year1 = pickHistoryEntry([a, b]);
    expect(year1?.id).toBe("a");
    a.dateLastShown = new Date("2024-06-01"); // simulate "served" this year

    const year2 = pickHistoryEntry([a, b]);
    expect(year2?.id).toBe("b"); // b has never been shown, a has
    b.dateLastShown = new Date("2025-06-01");

    const year3 = pickHistoryEntry([a, b]);
    expect(year3?.id).toBe("a"); // a's date_last_shown is now older than b's
  });
});

describe("isFirstVisitToday (spec 4.1 once-daily gate)", () => {
  it("is true when the session has never seen a history entry", () => {
    expect(isFirstVisitToday(null)).toBe(true);
  });

  it("is false when last shown earlier the same day", () => {
    const now = new Date("2026-03-05T18:00:00Z");
    const lastShown = new Date("2026-03-05T09:00:00Z");
    expect(isFirstVisitToday(lastShown, now)).toBe(false);
  });

  it("is true when last shown on a different day", () => {
    const now = new Date("2026-03-05T09:00:00Z");
    const lastShown = new Date("2026-03-04T09:00:00Z");
    expect(isFirstVisitToday(lastShown, now)).toBe(true);
  });

  it("is true when last shown on the same month/day a year earlier", () => {
    const now = new Date("2026-03-05T09:00:00Z");
    const lastShown = new Date("2025-03-05T09:00:00Z");
    expect(isFirstVisitToday(lastShown, now)).toBe(true);
  });
});
