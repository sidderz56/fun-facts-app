import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSession } from "@/lib/session";
import { reshuffleCategory } from "@/lib/selectionCore";

// Plain GET + redirect, same reasoning as /api/next-fact: this mutates
// state (clears seen_fact_ids, fully or scoped to one category) so it must
// never be served from a client-side link cache.
export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");
  const categorySlug = request.nextUrl.searchParams.get("category");
  const session = await getOrCreateSession();

  if (scope === "all") {
    await prisma.session.update({
      where: { anonId: session.anonId },
      data: { seenFactIds: [] },
    });
    return NextResponse.redirect(new URL("/api/next-fact?category=random", request.url));
  }

  if (scope === "category" && categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (category) {
      const categoryFacts = await prisma.fact.findMany({
        where: { categoryId: category.id },
        select: { id: true },
      });
      const nextSeen = reshuffleCategory(
        session.seenFactIds,
        categoryFacts.map((f) => f.id)
      );
      await prisma.session.update({
        where: { anonId: session.anonId },
        data: { seenFactIds: nextSeen },
      });
      return NextResponse.redirect(new URL(`/api/next-fact?category=${categorySlug}`, request.url));
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}
