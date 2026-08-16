// Verification workflow logic (spec 2.4, 2.5, 2.9) — Phase 4. Pure
// functions only, so they're unit-testable without a database. Called from
// lib/factMutations.ts at the point a fact is asked to transition into
// `verified`, not at creation — drafts are allowed to be incomplete.

export type SourceTier = "primary" | "secondary";
export type Source = { url: string; name: string; accessedDate: string; tier: SourceTier };

// Only these two statuses are ever servable to end users (spec 2.4 Phase 1
// step 3: needs_reverification is explicitly "publishable now, flagged for
// later re-check", not a draft state).
export const SERVABLE_VERIFICATION_STATUSES = ["verified", "needs_reverification"] as const;

type Result = { ok: true } | { ok: false; reason: string };

// spec 2.4: >=2 independent sources with >=1 tier:primary: OR the
// single-source exception (exactly one source, it must be primary, and it
// requires a non-empty verification_note). "Independence" (shared-ancestor
// detection) is a human judgment call per spec 2.4 and is deliberately not
// checked here — this validates only the structural count/tier rule.
export function validateSources(sources: Source[], verificationNote: string | null): Result {
  if (sources.length === 0) {
    return { ok: false, reason: "At least one source is required." };
  }

  const primaryCount = sources.filter((s) => s.tier === "primary").length;
  const hasNote = Boolean(verificationNote && verificationNote.trim() !== "");

  if (sources.length === 1) {
    if (primaryCount !== 1) {
      return { ok: false, reason: "A single source must be tier: primary to use the single-source exception." };
    }
    if (!hasNote) {
      return { ok: false, reason: "The single-source exception requires a non-empty verification_note." };
    }
    return { ok: true };
  }

  if (primaryCount === 0) {
    return { ok: false, reason: "At least one source must be tier: primary." };
  }

  return { ok: true };
}

// spec 2.9: >75 words is a hard rejection; 51-75 requires a
// verification_note; <=50 needs nothing further here (a <15-word fact is
// permitted but flagged for review — a quality concern handled by 2.10's
// review process, not a length-validation failure).
export function validateLength(wordCount: number, verificationNote: string | null): Result {
  if (wordCount > 75) {
    return { ok: false, reason: `Fact is ${wordCount} words; the hard limit is 75.` };
  }
  if (wordCount > 50) {
    const hasNote = Boolean(verificationNote && verificationNote.trim() !== "");
    if (!hasNote) {
      return { ok: false, reason: "51-75 word facts require a non-empty verification_note." };
    }
  }
  return { ok: true };
}

// spec 2.5: a time_sensitive fact must carry a real cadence, and `custom`
// cadence must carry an explicit due date.
export function validateStaleness(
  timeSensitive: boolean,
  cadence: string | null,
  customDueDate: Date | null
): Result {
  if (!timeSensitive) return { ok: true };

  if (!cadence || cadence === "none") {
    return { ok: false, reason: "time_sensitive facts require a reverification_cadence." };
  }
  if (cadence === "custom" && !customDueDate) {
    return { ok: false, reason: "cadence 'custom' requires an explicit reverification_due_date." };
  }
  return { ok: true };
}

const CADENCE_MONTHS: Record<string, number> = {
  quarterly: 3,
  semiannual: 6,
  annual: 12,
  biennial: 24,
};

// spec 2.5: computed from cadence + date_last_verified; `custom` cadences
// use the explicitly-provided due date instead of a computed offset.
export function computeReverificationDueDate(
  cadence: string,
  dateLastVerified: Date,
  explicitDueDate: Date | null
): Date | null {
  if (cadence === "none") return null;
  if (cadence === "custom") return explicitDueDate;

  const months = CADENCE_MONTHS[cadence];
  if (months === undefined) return null;

  const due = new Date(dateLastVerified);
  due.setUTCMonth(due.getUTCMonth() + months);
  return due;
}

export type VerifiableFact = {
  sources: Source[];
  verificationNote: string | null;
  wordCount: number;
  timeSensitive: boolean;
  reverificationCadence: string | null;
  reverificationDueDate: Date | null;
};

export type VerificationCheckResult = { ok: true } | { ok: false; reasons: string[] };

// The full gate a fact must pass to transition into verification_status =
// 'verified' (spec 2.4, 2.5, 2.9), combining all three checks above.
export function canReachVerified(fact: VerifiableFact): VerificationCheckResult {
  const reasons: string[] = [];

  const sourceResult = validateSources(fact.sources, fact.verificationNote);
  if (!sourceResult.ok) reasons.push(sourceResult.reason);

  const lengthResult = validateLength(fact.wordCount, fact.verificationNote);
  if (!lengthResult.ok) reasons.push(lengthResult.reason);

  const stalenessResult = validateStaleness(
    fact.timeSensitive,
    fact.reverificationCadence,
    fact.reverificationDueDate
  );
  if (!stalenessResult.ok) reasons.push(stalenessResult.reason);

  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}
