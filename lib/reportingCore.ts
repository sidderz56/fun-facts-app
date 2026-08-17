// Reporting/abuse-limiting decision logic (spec 5.3). Pure functions only,
// so they're unit-testable without a database — mirrors the split in
// lib/verification.ts and lib/selectionCore.ts. The DB-touching orchestration
// (counting recent reports, writing rows) lives in lib/reporting.ts.

// spec 5.3: "max 10 reports per anon_id per rolling hour" / "max 30 per IP
// per rolling hour."
export const SESSION_RATE_LIMIT_PER_HOUR = 10;
export const IP_RATE_LIMIT_PER_HOUR = 30;

export type ReportDecision =
  | { action: "record" }
  | { action: "acknowledge_only"; reason: "already_open" | "session_rate_limited" | "ip_rate_limited" };

// spec 5.3: one open report per (fact, anon_id) — idempotent, not an error.
// Beyond either rate limit, taps are "silently accepted in the UI but not
// recorded" — the caller always acknowledges success regardless of which
// branch fires, so a reporter can't distinguish "recorded" from
// "rate-limited" from "already open." That's intentional: it gives an
// attacker no signal to calibrate against.
export function decideReport(params: {
  hasOpenReport: boolean;
  sessionCountLastHour: number;
  ipCountLastHour: number;
}): ReportDecision {
  if (params.hasOpenReport) {
    return { action: "acknowledge_only", reason: "already_open" };
  }
  if (params.sessionCountLastHour >= SESSION_RATE_LIMIT_PER_HOUR) {
    return { action: "acknowledge_only", reason: "session_rate_limited" };
  }
  if (params.ipCountLastHour >= IP_RATE_LIMIT_PER_HOUR) {
    return { action: "acknowledge_only", reason: "ip_rate_limited" };
  }
  return { action: "record" };
}

// spec 5.3: auto-pull fires once distinct open reports reach the
// (configurable) threshold. reportsSinceReview is already "count of
// unresolved report rows" per spec 3.1, so this is a plain comparison.
export function shouldAutoPull(reportsSinceReview: number, threshold: number): boolean {
  return reportsSinceReview >= threshold;
}
