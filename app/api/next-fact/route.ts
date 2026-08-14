import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSession, markFactSeen } from "@/lib/session";
import { pickCategoryFact, pickRandomFact } from "@/lib/selection";

// Plain GET + redirect (not a client-side fetch) so every tap on Home and
// every action button on the fact-view screen works as a normal link —
// no client JS required for the Phase 0 core loop.
export async function GET(request: NextRequest) {
  const categorySlug = request.nextUrl.searchParams.get("category");
  const session = await getOrCreateSession();

  const fact =
    categorySlug && categorySlug !== "random"
      ? await pickForCategorySlug(categorySlug, session.seenFactIds)
      : await pickRandomFact(session.seenFactIds);

  if (!fact) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await markFactSeen(session.anonId, fact.id, session.seenFactIds);

  return NextResponse.redirect(new URL(`/fact/${fact.shareSlug}`, request.url));
}

async function pickForCategorySlug(slug: string, seenFactIds: string[]) {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return null;
  return pickCategoryFact(category.id, seenFactIds);
}
