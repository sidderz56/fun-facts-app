// Event capture (spec 5.8). Deliberately just a table write, not a
// platform — every call here is a single insert, fire-and-forget from the
// caller's perspective. Keyed on anon_id only; no PII, no third-party
// identifiers (spec 5.2).
import { prisma } from "@/lib/db";
import type {
  EventType,
  FactViewSource,
  ExhaustionScope,
} from "@/app/generated/prisma/client";

const VALID_SOURCES: readonly FactViewSource[] = ["tile", "another", "random", "share_page"];

// Every internal navigation to app/fact/[slug]/page.tsx sets ?src
// explicitly (Home tiles, AnotherButton, HistoryCard — see
// app/api/next-fact/route.ts and those components). No param at all means
// the visit didn't come through one of those controlled paths — i.e. a
// shared link, a bookmark, or a typed URL — which is exactly spec 5.8's
// "share-page arrival" bucket. Pure and unit-tested since it's the one
// piece of real judgment in event capture: every other write here is a
// straight pass-through of caller-supplied values.
export function resolveSource(src: string | undefined): FactViewSource {
  return src && (VALID_SOURCES as readonly string[]).includes(src) ? (src as FactViewSource) : "share_page";
}

type LogEventInput = {
  anonId: string;
  type: EventType;
  shareSlug?: string | null;
  categorySlug?: string | null;
  source?: FactViewSource | null;
  exhaustionScope?: ExhaustionScope | null;
};

// Never throws into the caller — analytics must not be able to break the
// product loop. A failed event write is a silent gap in the numbers, not a
// broken page.
export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        anonId: input.anonId,
        type: input.type,
        shareSlug: input.shareSlug ?? null,
        categorySlug: input.categorySlug ?? null,
        source: input.source ?? null,
        exhaustionScope: input.exhaustionScope ?? null,
      },
    });
  } catch (e) {
    console.error("logEvent failed", input.type, e);
  }
}

// spec 5.8 lists "fact viewed" and "share-page arrival" as two distinct
// events for the same visit when the source is a share page — this fires
// both in one call so every call site doesn't have to remember the pairing.
export async function logFactViewed(params: {
  anonId: string;
  shareSlug: string;
  categorySlug: string;
  source: FactViewSource;
}): Promise<void> {
  await logEvent({
    anonId: params.anonId,
    type: "fact_viewed",
    shareSlug: params.shareSlug,
    categorySlug: params.categorySlug,
    source: params.source,
  });

  if (params.source === "share_page") {
    await logEvent({
      anonId: params.anonId,
      type: "share_page_arrival",
      shareSlug: params.shareSlug,
      categorySlug: params.categorySlug,
    });
  }
}
