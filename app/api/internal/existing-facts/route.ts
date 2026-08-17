import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Read-only companion to /api/internal/draft-fact — lets the daily
// drafting routine see what's already been covered in a category so it
// doesn't redraft the same topic. Not a privacy concern (this is the exact
// text already public on the site to any visitor), but still gated behind
// the same token to keep this a closed, single-purpose API surface rather
// than an open one.
function authorized(request: NextRequest): boolean {
  const expected = process.env.INTERNAL_DRAFT_API_KEY;
  if (!expected) return false;

  const auth = request.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const categorySlug = request.nextUrl.searchParams.get("categorySlug");
  if (!categorySlug) {
    return NextResponse.json({ ok: false, error: "categorySlug query param required" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    return NextResponse.json({ ok: false, error: `Unknown category slug: ${categorySlug}` }, { status: 400 });
  }

  // active (not retired) covers everything a reader could still encounter —
  // draft/pending_review included, so an in-flight duplicate from a
  // previous run's partial failure still counts as "already covered."
  const facts = await prisma.fact.findMany({
    where: { categoryId: category.id, active: true },
    select: { text: true },
  });

  return NextResponse.json({ ok: true, texts: facts.map((f) => f.text) });
}
