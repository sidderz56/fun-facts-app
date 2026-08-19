// Fact mutation layer (spec 3.5). Every function here performs its Prisma
// write and the corresponding fact_revisions row inside one transaction —
// nothing is ever updated in place without a matching audit row, and
// nothing is ever hard-deleted. This is the layer Phase 5 (auto-pull) and
// Phase 6 (admin dashboard) call into; today it has no UI caller yet, so
// it's exercised by scripts/seed-dev.ts (via createFact + verifyFact) and
// by tests.
import { prisma } from "@/lib/db";
import type { RetiredReason } from "@/app/generated/prisma/client";
import { canReachVerified, computeReverificationDueDate, type Source } from "@/lib/verification";
import { countWords, factLengthClass } from "@/lib/textMetrics";
import { generateShareSlug } from "@/lib/shareSlug";

function parseSources(json: unknown): Source[] {
  return Array.isArray(json) ? (json as Source[]) : [];
}

function requireReason(reason: string, fnName: string): void {
  if (!reason || reason.trim() === "") {
    throw new Error(`${fnName} requires a non-empty reason (spec 3.5).`);
  }
}

export type CreateFactInput = {
  text: string;
  categoryId: string;
  patternTags?: string[];
  sources?: Source[];
  verificationNote?: string | null;
  timeSensitive?: boolean;
  reverificationCadence?: "none" | "quarterly" | "semiannual" | "annual" | "biennial" | "custom" | null;
  reverificationDueDate?: Date | null;
};

// Creates a fact in `draft` status (the schema default) and writes the
// matching `created` revision row (spec 2.4 step 1, spec 3.5). Reaching
// `verified` is a separate transition — see verifyFact.
export async function createFact(input: CreateFactInput, actor: string) {
  const wordCount = countWords(input.text);

  return prisma.$transaction(async (tx) => {
    const fact = await tx.fact.create({
      data: {
        text: input.text,
        categoryId: input.categoryId,
        patternTags: input.patternTags ?? [],
        sources: (input.sources ?? []) as object,
        wordCount,
        factLengthClass: factLengthClass(wordCount),
        verificationNote: input.verificationNote ?? null,
        timeSensitive: input.timeSensitive ?? false,
        reverificationCadence: input.reverificationCadence ?? null,
        reverificationDueDate: input.reverificationDueDate ?? null,
        shareSlug: generateShareSlug(),
      },
    });

    await tx.factRevision.create({
      data: {
        factId: fact.id,
        changeType: "created",
        newStatus: fact.verificationStatus,
        actor,
      },
    });

    return fact;
  });
}

// Attempts the draft -> verified transition, enforcing the spec 2.4/2.5/2.9
// checks (lib/verification.ts). Throws if the fact doesn't pass — callers
// (seed script, future admin actions) are expected to fix the data and
// retry rather than silently downgrade the check.
export async function verifyFact(factId: string, actor: string) {
  return prisma.$transaction(async (tx) => {
    const fact = await tx.fact.findUniqueOrThrow({ where: { id: factId } });

    const check = canReachVerified({
      sources: parseSources(fact.sources),
      verificationNote: fact.verificationNote,
      wordCount: fact.wordCount ?? countWords(fact.text),
      timeSensitive: fact.timeSensitive,
      reverificationCadence: fact.reverificationCadence,
      reverificationDueDate: fact.reverificationDueDate,
    });

    if (!check.ok) {
      throw new Error(`Fact ${factId} cannot reach verified: ${check.reasons.join("; ")}`);
    }

    const updated = await tx.fact.update({
      where: { id: factId },
      data: { verificationStatus: "verified", dateLastVerified: new Date() },
    });

    await tx.factRevision.create({
      data: {
        factId,
        changeType: "status_changed",
        previousStatus: fact.verificationStatus,
        newStatus: "verified",
        actor,
      },
    });

    return updated;
  });
}

export type RetireFactParams = {
  reason: string;
  actor: string;
  retiredReason: RetiredReason;
  supersededById?: string;
};

// Retires a fact (active -> false) without deleting it, writing a `retired`
// revision row with the required reason (spec 3.5, plan Phase 4 acceptance
// criterion). Rendering the retired/superseded state was already built in
// Phase 2 (app/fact/[slug]/page.tsx) — this is the write side.
export async function retireFact(factId: string, params: RetireFactParams) {
  requireReason(params.reason, "retireFact");

  return prisma.$transaction(async (tx) => {
    const fact = await tx.fact.findUniqueOrThrow({ where: { id: factId } });

    const updated = await tx.fact.update({
      where: { id: factId },
      data: {
        active: false,
        retiredReason: params.retiredReason,
        supersededById: params.supersededById ?? null,
      },
    });

    await tx.factRevision.create({
      data: {
        factId,
        changeType: "retired",
        previousStatus: fact.verificationStatus,
        newStatus: fact.verificationStatus,
        reason: params.reason,
        actor: params.actor,
      },
    });

    return updated;
  });
}

// Reverses a retirement (active -> true), typically correcting a wrong
// auto-pull (spec 5.3, Phase 5).
export async function restoreFact(factId: string, params: { reason: string; actor: string }) {
  requireReason(params.reason, "restoreFact");

  return prisma.$transaction(async (tx) => {
    await tx.fact.update({
      where: { id: factId },
      data: { active: true, retiredReason: null },
    });

    const updated = await tx.fact.findUniqueOrThrow({ where: { id: factId } });

    await tx.factRevision.create({
      data: {
        factId,
        changeType: "restored",
        reason: params.reason,
        actor: params.actor,
      },
    });

    return updated;
  });
}

// Edits a fact's text, preserving the prior wording in the revision row
// (spec 3.5: "previous_text | populated on text_edited — the full prior
// wording"). Recomputes word_count/fact_length_class since the text changed.
export async function editFactText(factId: string, newText: string, params: { reason: string; actor: string }) {
  requireReason(params.reason, "editFactText");

  const wordCount = countWords(newText);

  return prisma.$transaction(async (tx) => {
    const fact = await tx.fact.findUniqueOrThrow({ where: { id: factId } });

    const updated = await tx.fact.update({
      where: { id: factId },
      data: { text: newText, wordCount, factLengthClass: factLengthClass(wordCount) },
    });

    await tx.factRevision.create({
      data: {
        factId,
        changeType: "text_edited",
        previousText: fact.text,
        reason: params.reason,
        actor: params.actor,
      },
    });

    return updated;
  });
}

// spec 5.7 dashboard action "Confirm re-verification": updates
// date_last_verified and recomputes the next due date, moving the fact back
// to `verified` regardless of what it was before (draft facts don't carry a
// reverification_due_date in the first place, so this is only ever reached
// from `verified` or `needs_reverification`). For `custom` cadence the due
// date can't be auto-computed — spec 2.5 says it's explicit — so the
// founder supplies the new date via the dashboard form; every other cadence
// computes it from today.
export async function confirmReverification(
  factId: string,
  actor: string,
  explicitDueDate?: Date | null
) {
  return prisma.$transaction(async (tx) => {
    const fact = await tx.fact.findUniqueOrThrow({ where: { id: factId } });
    const now = new Date();
    const dueDate = fact.reverificationCadence
      ? computeReverificationDueDate(fact.reverificationCadence, now, explicitDueDate ?? null)
      : null;

    const updated = await tx.fact.update({
      where: { id: factId },
      data: { dateLastVerified: now, reverificationDueDate: dueDate, verificationStatus: "verified" },
    });

    await tx.factRevision.create({
      data: {
        factId,
        changeType: "reverified",
        previousStatus: fact.verificationStatus,
        newStatus: "verified",
        actor,
      },
    });

    return updated;
  });
}

// spec 8 re-verification job: flips a fact from `verified` to
// `needs_reverification` once its due date has passed. Both statuses are
// servable (spec 2.4 Phase 1 step 3: "needs_reverification is explicitly
// 'publishable now, flagged for later re-check'"), so this never
// interrupts what users see — it just makes the fact's own record reflect
// reality instead of relying solely on the admin dashboard's live
// due-date query to notice. actor="system" since this runs unattended on
// a schedule, matching auto-pull's precedent.
export async function flagDueForReverification(factId: string) {
  return prisma.$transaction(async (tx) => {
    const fact = await tx.fact.findUniqueOrThrow({ where: { id: factId } });

    const updated = await tx.fact.update({
      where: { id: factId },
      data: { verificationStatus: "needs_reverification" },
    });

    await tx.factRevision.create({
      data: {
        factId,
        changeType: "status_changed",
        previousStatus: fact.verificationStatus,
        newStatus: "needs_reverification",
        actor: "system",
      },
    });

    return updated;
  });
}

// Auto-pull (spec 5.3): the system, not a founder, retiring a fact once
// distinct open reports reach the configured threshold. Deliberately
// leaves `retired_reason` null — spec 5.3 is explicit that `report_upheld`
// is set "only when review confirms, not by the auto-pull itself," so this
// is NOT retireFact() with a canned reason. The fact sits out
// (active = false) pending the daily review, fully reversible via
// restoreFact.
export async function autoPullFact(factId: string, params: { reportCount: number }) {
  return prisma.$transaction(async (tx) => {
    const fact = await tx.fact.findUniqueOrThrow({ where: { id: factId } });

    const updated = await tx.fact.update({
      where: { id: factId },
      data: { active: false },
    });

    await tx.factRevision.create({
      data: {
        factId,
        changeType: "retired",
        previousStatus: fact.verificationStatus,
        newStatus: fact.verificationStatus,
        reason: `Auto-pulled after ${params.reportCount} distinct open reports reached the configured threshold.`,
        actor: "system",
      },
    });

    return updated;
  });
}

// Updates quality_score (spec 2.10) — an internal signal, not tied to
// verification_status, so no reason is required (matches the dashboard's
// permitted write-action list in spec 5.7, which lists "Re-score quality"
// with no note requirement).
export async function rescoreFact(factId: string, newScore: number, actor: string) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.fact.update({
      where: { id: factId },
      data: { qualityScore: newScore },
    });

    await tx.factRevision.create({
      data: { factId, changeType: "quality_rescored", actor },
    });

    return updated;
  });
}
