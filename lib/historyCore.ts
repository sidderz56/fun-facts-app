// Pure, DB-free "this day in history" logic (spec 3.4) — kept separate from
// lib/history.ts so it can be unit tested without a database.

const DEFAULT_QUALITY_SCORE = 3; // null treated as baseline, consistent with 2.10

// "MM-DD", zero-padded. Deliberately not timezone-aware — the spec doesn't
// call for per-user timezone detection, so this uses the server's date.
export function getMonthDay(date: Date = new Date()): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}-${day}`;
}

export type HistoryCandidate = {
  dateLastShown: Date | null;
  qualityScore: number | null;
};

// Among candidates for today's month_day: oldest date_last_shown wins
// (nulls first), ties broken by highest quality_score. This gives
// year-over-year rotation for free — once an entry is shown, it sorts to
// the back until every other candidate for that date has had a turn.
export function pickHistoryEntry<T extends HistoryCandidate>(candidates: T[]): T | null {
  if (candidates.length === 0) return null;

  return [...candidates].sort((a, b) => {
    const aTime = a.dateLastShown?.getTime() ?? -Infinity;
    const bTime = b.dateLastShown?.getTime() ?? -Infinity;
    if (aTime !== bTime) return aTime - bTime;
    return (b.qualityScore ?? DEFAULT_QUALITY_SCORE) - (a.qualityScore ?? DEFAULT_QUALITY_SCORE);
  })[0];
}

// True once per calendar day per session — drives the once-daily full-card
// display (spec 4.1): "last_history_fact_shown_date gates the once-daily
// display." Compares by UTC calendar date, matching getMonthDay's timezone choice.
export function isFirstVisitToday(lastShown: Date | null, now: Date = new Date()): boolean {
  if (!lastShown) return true;
  return (
    lastShown.getUTCFullYear() !== now.getUTCFullYear() ||
    lastShown.getUTCMonth() !== now.getUTCMonth() ||
    lastShown.getUTCDate() !== now.getUTCDate()
  );
}
