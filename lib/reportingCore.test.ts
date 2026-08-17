import { describe, it, expect } from "vitest";
import {
  decideReport,
  shouldAutoPull,
  SESSION_RATE_LIMIT_PER_HOUR,
  IP_RATE_LIMIT_PER_HOUR,
} from "./reportingCore";

describe("decideReport (spec 5.3)", () => {
  const clean = { hasOpenReport: false, sessionCountLastHour: 0, ipCountLastHour: 0 };

  it("records a fresh report under every limit", () => {
    expect(decideReport(clean)).toEqual({ action: "record" });
  });

  it("acknowledges without recording when an open report already exists (idempotent repeat taps)", () => {
    expect(decideReport({ ...clean, hasOpenReport: true })).toEqual({
      action: "acknowledge_only",
      reason: "already_open",
    });
  });

  it("acknowledges without recording at the per-session rate limit", () => {
    expect(decideReport({ ...clean, sessionCountLastHour: SESSION_RATE_LIMIT_PER_HOUR })).toEqual({
      action: "acknowledge_only",
      reason: "session_rate_limited",
    });
  });

  it("still records one below the per-session rate limit", () => {
    expect(decideReport({ ...clean, sessionCountLastHour: SESSION_RATE_LIMIT_PER_HOUR - 1 })).toEqual({
      action: "record",
    });
  });

  it("acknowledges without recording at the per-IP rate limit", () => {
    expect(decideReport({ ...clean, ipCountLastHour: IP_RATE_LIMIT_PER_HOUR })).toEqual({
      action: "acknowledge_only",
      reason: "ip_rate_limited",
    });
  });

  it("checks already-open before either rate limit", () => {
    expect(
      decideReport({
        hasOpenReport: true,
        sessionCountLastHour: SESSION_RATE_LIMIT_PER_HOUR,
        ipCountLastHour: IP_RATE_LIMIT_PER_HOUR,
      })
    ).toEqual({ action: "acknowledge_only", reason: "already_open" });
  });
});

describe("shouldAutoPull (spec 5.3)", () => {
  it("does not trip below the threshold", () => {
    expect(shouldAutoPull(2, 3)).toBe(false);
  });

  it("trips exactly at the threshold", () => {
    expect(shouldAutoPull(3, 3)).toBe(true);
  });

  it("trips above the threshold", () => {
    expect(shouldAutoPull(5, 3)).toBe(true);
  });

  it("respects a reconfigured threshold with no code change", () => {
    expect(shouldAutoPull(3, 5)).toBe(false);
    expect(shouldAutoPull(5, 5)).toBe(true);
  });
});
