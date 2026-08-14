import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrCreateSession, markFactSeen } from "@/lib/session";
import FactView from "@/components/FactView";

export default async function FactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const fact = await prisma.fact.findUnique({
    where: { shareSlug: slug },
    include: { category: true },
  });

  // Phase 0 has no retired facts yet (active is always true), so a missing
  // slug is a genuine 404. Phase 2 changes this: retired facts must keep
  // resolving (spec 4.4), never 404.
  if (!fact) notFound();

  const session = await getOrCreateSession();
  await markFactSeen(session.anonId, fact.id, session.seenFactIds);

  return <FactView fact={fact} category={fact.category} />;
}
