// Report submission (spec 3.6, 5.3). Fetches/writes Postgres and delegates
// the actual rate-limit/dedupe/auto-pull decisions to the pure functions in
// lib/reportingCore.ts — same split as lib/selection.ts vs
// lib/selectionCore.ts. Runs in the Node.js runtime (an API route, not
// middleware/proxy.ts), so Node's crypto module is available.
import { createHash } from "crypto";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { decideReport, shouldAutoPull } from "@/lib/reportingCore";
import { autoPullFact } from "@/lib/factMutations";
import { DEFAULT_AUTO_PULL_THRESHOLD } from "@/lib/constants";

const ROLLING_WINDOW_MS = 60 * 60 * 1000; // spec 5.3: rolling hour, both limits
const AUTO_PULL_THRESHOLD_KEY = "auto_pull_threshold";

// IPs are transient and rate-limiting-only (spec 5.2) — hashed before
// storage so even this short-lived table doesn't hold a raw IP.
function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

// spec 5.3: "the threshold lives in application config, not in code, and is
// editable without a deploy." Falls back to the code constant only if the
// app_config row is missing (e.g. a fresh environment before seeding).
async function getAutoPullThreshold(): Promise<number> {
  const row = await prisma.appConfig.findUnique({ where: { key: AUTO_PULL_THRESHOLD_KEY } });
  const parsed = row ? Number.parseInt(row.value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_AUTO_PULL_THRESHOLD;
}

export type SubmitReportResult = { recorded: boolean };

// Always resolves successfully (never throws for the "not recorded"
// branches) — the caller acknowledges the same way regardless, per spec
// 5.3's "silently accepted in the UI but not recorded."
export async function submitReport(
  factId: string,
  anonId: string,
  ip: string | null
): Promise<SubmitReportResult> {
  const windowStart = new Date(Date.now() - ROLLING_WINDOW_MS);
  const ipHash = ip ? hashIp(ip) : null;

  // Opportunistic prune keeps this table transient (spec 5.2) instead of
  // growing forever — cheap at this traffic scale, no separate job needed.
  await prisma.reportRateLimitEvent.deleteMany({ where: { createdAt: { lt: windowStart } } });

  const [existingOpen, sessionCount, ipCount] = await Promise.all([
    prisma.report.findFirst({ where: { factId, anonId, resolvedAt: null } }),
    prisma.report.count({ where: { anonId, createdAt: { gte: windowStart } } }),
    ipHash
      ? prisma.reportRateLimitEvent.count({ where: { ipHash, createdAt: { gte: windowStart } } })
      : 0,
  ]);

  const decision = decideReport({
    hasOpenReport: Boolean(existingOpen),
    sessionCountLastHour: sessionCount,
    ipCountLastHour: ipCount,
  });

  if (decision.action === "acknowledge_only") {
    return { recorded: false };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.report.create({ data: { factId, anonId } });
      if (ipHash) {
        await tx.reportRateLimitEvent.create({ data: { ipHash } });
      }
    });
  } catch (e) {
    // Concurrent double-tap racing past the check above — the partial
    // unique index (migration 20260817182932) catches it. Treat exactly
    // like the already-open case rather than surfacing a 500.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { recorded: false };
    }
    throw e;
  }

  // reports_since_review is "count of unresolved report rows" (spec 3.1) —
  // recomputed rather than incremented so it self-corrects if it ever drifts.
  const openReportCount = await prisma.report.count({ where: { factId, resolvedAt: null } });
  await prisma.fact.update({ where: { id: factId }, data: { reportsSinceReview: openReportCount } });

  const threshold = await getAutoPullThreshold();
  if (shouldAutoPull(openReportCount, threshold)) {
    const fact = await prisma.fact.findUnique({ where: { id: factId } });
    if (fact?.active) {
      await autoPullFact(factId, { reportCount: openReportCount });
    }
  }

  return { recorded: true };
}
