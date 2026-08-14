import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrCreateSession, markFactSeen } from "@/lib/session";
import FactView from "@/components/FactView";
import RetiredNotice from "@/components/RetiredNotice";
import { ogTitle, ogDescription } from "@/lib/ogText";

type FactPageProps = { params: Promise<{ slug: string }> };

// A missing slug is a genuine 404; a retired one is not — the URL may have
// been circulating for years, and per spec 4.4 it must keep resolving,
// showing the replacement fact if one was written.
async function resolveDisplayFact(slug: string) {
  const fact = await prisma.fact.findUnique({
    where: { shareSlug: slug },
    include: { category: true },
  });
  if (!fact) return null;
  if (fact.active) return { original: fact, display: fact };

  if (fact.supersededById) {
    const replacement = await prisma.fact.findUnique({
      where: { id: fact.supersededById },
      include: { category: true },
    });
    if (replacement) return { original: fact, display: replacement };
  }

  return { original: fact, display: null };
}

export async function generateMetadata({ params }: FactPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveDisplayFact(slug);
  if (!resolved) return {};

  const title = resolved.display ? ogTitle(resolved.display.text) : "Fun Fact: retired";
  const description = resolved.display
    ? ogDescription(resolved.display.text)
    : "This fact has been retired.";

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
