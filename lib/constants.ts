// The cookie holds anon_id and nothing else (spec 3.3) — no PII, no seen-list.
export const ANON_ID_COOKIE = "anon_id";

// spec 5.3: "3 is correct at launch volume and probably far too low at 100x
// that." The real, editable-without-a-deploy value lives in the app_config
// table (lib/reporting.ts) — this is only the fallback when that row is
// missing (e.g. a fresh environment before the seed script has run).
export const DEFAULT_AUTO_PULL_THRESHOLD = 3;
