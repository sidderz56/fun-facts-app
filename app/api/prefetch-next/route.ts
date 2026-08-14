import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSession } from "@/lib/session";
import { pickCategoryFact } from "@/lib/selection";

// Computes (without recording) the next likely candidate for this category,
// so the fact-view screen can link "Another" straight at it instead of
// round-tripping through /api/next-fact at click time (spec 5.1). Doesn't
// call markFactSeen — that only happens when the fact is actually viewed,
// in app/fact/[slug]/page.tsx. Returns { slug: null } if there's no
// candidate (still loading is indistinguishable from exhausted on purpose —
// both cases correctly fall back to the authoritative /api/next-fact path).
export async function GET(request: NextRequest) {
  const categorySlug = request.nextUrl.searchParams.get("category");
  if (!categorySlug) {
    return NextResponse.json({ slug: null });
  }

  const session = await getOrCreateSession();
  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    return NextResponse.json({ slug: null });
  }

  const fact = await pickCategoryFact(category.id, session.seenFactIds);
  return NextResponse.json({ slug: fact?.shareSlug ?? null });
}
