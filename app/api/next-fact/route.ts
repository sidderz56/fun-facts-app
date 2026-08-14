import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSession, markFactSeen } from "@/lib/session";
import { pickCategoryFact, pickRandomFact } from "@/lib/selection";

// Plain GET + redirect (not a client-side fetch) so every tap on Home and
// every action button on the fact-view screen works as a normal link —
// no client JS required for the core loop.
export async function GET(request: NextRequest) {
  const categorySlug = request.nextUrl.searchParams.get("category");
  const session = await getOrCreateSession();

  if (categorySlug && categorySlug !== "random") {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const fact = await pickCategoryFact(category.id, session.seenFactIds);
    if (!fact) {
      // Category exhausted (spec 4.3) — explicit state, not a silent repeat.
      return NextResponse.redirect(
        new URL(`/exhausted?scope=category&category=${categorySlug}`, request.url)
      );
    }

    await markFactSeen(session.anonId, fact.id, session.seenFactIds);
    return NextResponse.redirect(new URL(`/fact/${fact.shareSlug}`, request.url));
  }

  const fact = await pickRandomFact(session.seenFactIds);
  if (!fact) {
    // Every category exhausted (spec 4.3). Random stays a live tile rather
    // than greying out — tapping it here is what surfaces this state.
    return NextResponse.redirect(new URL("/exhausted?scope=all", request.url));
  }

  await markFactSeen(session.anonId, fact.id, session.seenFactIds);
  return NextResponse.redirect(new URL(`/fact/${fact.shareSlug}`, request.url));
}
