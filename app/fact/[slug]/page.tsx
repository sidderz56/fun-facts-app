import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrCreateSession, markFactSeen } from "@/lib/session";
import { markHistoryEntryShown } from "@/lib/history";
import { countWords, factLengthClass } from "@/lib/textMetrics";
import FactView from "@/components/FactView";
import RetiredNotice from "@/components/RetiredNotice";
import { ogTitle, ogDescription } from "@/lib/ogText";
import { SERVABLE_VERIFICATION_STATUSES } from "@/lib/verification";

type FactPageProps = { params: Promise<{ slug: string }> };

function isServable(status: string): boolean {
  return (SERVABLE_VERIFICATION_STATUSES as readonly string[]).includes(status);
}

// This day in history entries aren't tied to a category (spec 3.4), so the
// back-link shows this instead. An empty slug isn't a real category — the
// selection routes (next-fact, prefetch-next) already treat a blank
// category param as "no category specified" and fall back to a Random pick,
// which is a reasonable "Another" behavior when there's no category to
// continue in.
const HISTORY_CATEGORY = { name: "On this day", slug: "" };

// A missing slug is a genuine 404; a retired one is not — the URL may have
// been circulating for years, and per spec 4.4 it must keep resolving,
// showing the replacement fact if one was written. Also checks
// this_day_in_history (spec 3.4): those entries share the same /fact/{slug}
// URL space and reuse this same view.
//
// A fact that's active but NOT verified/needs_reverification (draft,
// pending_review, rejected) is treated as not found rather than shown:
// unlike a retired fact, it was never legitimately servable in the first
// place, so no share link for it should exist — Phase 4 closes this off
// defensively rather than trusting that no such link ever leaks out.
async function resolveDisplayFact(slug: string) {
  const fact = await prisma.fact.findUnique({
    where: { shareSlug: slug },
    include: { category: true },
  });

  if (fact) {
    if (fact.active) {
      return isServable(fact.verificationStatus)
        ? { kind: "fact" as const, original: fact, display: fact }
        : null;
    }

    if (fact.supersededById) {
      const replacement = await prisma.fact.findUnique({
        where: { id: fact.supersededById },
        include: { category: true },
      });
      if (replacement && isServable(replacement.verificationStatus)) {
        return { kind: "fact" as const, original: fact, display: replacement };
      }
    }

    return { kind: "fact" as const, original: fact, display: null };
  }

  const historyEntry = await prisma.thisDayInHistory.findUnique({ where: { shareSlug: slug } });
  if (historyEntry && historyEntry.active && isServable(historyEntry.verificationStatus)) {
    return { kind: "history" as const, entry: historyEntry };
  }

  return null;
}

export async function generateMetadata({ params }: FactPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveDisplayFact(slug);
  if (!resolved) return {};

  const text =
    resolved.kind === "history" ? resolved.entry.text : (resolved.display?.text ?? null);

  const title = text ? ogTitle(text) : "Fun Fact: retired";
  const description = text ? ogDescription(text) : "This fact has been retired.";

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FactPage({ params }: FactPageProps) {
  const { slug } = await params;
  const resolved = await resolveDisplayFact(slug);
  if (!resolved) notFound();

  if (resolved.kind === "history") {
    const { entry } = resolved;
    // Updates date_last_shown so next year's rotation moves on (spec 3.4).
    await markHistoryEntryShown(entry.id);

    return (
      <FactView
        fact={{
          text: entry.text,
          factLengthClass: factLengthClass(entry.wordCount ?? countWords(entry.text)),
          shareSlug: entry.shareSlug,
        }}
        category={HISTORY_CATEGORY}
      />
    );
  }

  const { original, display } = resolved;
  const session = await getOrCreateSession();
  await markFactSeen(session.anonId, original.id, session.seenFactIds);

  if (!display) {
    return <RetiredNotice category={original.category} />;
  }

  if (display.id !== original.id) {
    // Superseded — the replacement's own view, plus a note (spec 4.4).
    await markFactSeen(session.anonId, display.id, session.seenFactIds);
    return <FactView fact={display} category={display.category} note="This fact was updated." />;
  }

  return <FactView fact={display} category={display.category} />;
}
