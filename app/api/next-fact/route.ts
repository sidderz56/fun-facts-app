import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSession, markFactSeen } from "@/lib/session";
import { pickCategoryFact, pickRandomFact } from "@/lib/selection";

// Plain GET + redirect (not a client-side fetch) so every tap on Home and
// every action button on the fact-view screen works as a normal link —
// no client JS required for the core loop.
//
// The optional `src=another` param is how AnotherButton's slow-path
// fallback (window.location.href = /api/next-fact?category=X) tells this
// route apart from a fresh Home tile tap — both hit this same route with
// just a category, so without it there'd be no way to log the right
// fact_viewed source (spec 5.8) on the /fact/{slug} redirect target. A
// bare tile/Random tap never sends this param, so it falls through to the
// category-derived default below.
export async function GET(request: NextRequest) {
  const categorySlug = request.nextUrl.searchParams.get("category");
  const explicitSrc = request.nextUrl.searchParams.get("src");
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
    const src = explicitSrc === "another" ? "another" : "tile";
    return NextResponse.redirect(new URL(`/fact/${fact.shareSlug}?src=${src}`, request.url));
  }

  const fact = await pickRandomFact(session.seenFactIds);
  if (!fact) {
    // Every category exhausted (spec 4.3). Random stays a live tile rather
    // than greying out — tapping it here is what surfaces this state.
    return NextResponse.redirect(new URL("/exhausted?scope=all", request.url));
  }

  await markFactSeen(session.anonId, fact.id, session.seenFactIds);
  const src = explicitSrc === "another" ? "another" : "random";
  return NextResponse.redirect(new URL(`/fact/${fact.shareSlug}?src=${src}`, request.url));
}
