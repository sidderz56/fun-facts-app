import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createFact, verifyFact } from "@/lib/factMutations";
import type { Source } from "@/lib/verification";

// Narrow-purpose endpoint for the scheduled daily content-drafting routine
// (a sandboxed cloud agent with no direct database access — see the
// conversation this was set up in). Deliberately the same create->verify
// pipeline used by every other content-drafting path in this app
// (scripts/draft-facts-batch-*.ts), so a fact inserted here passes the
// identical spec 2.4 gate — this endpoint adds no new trust, it just gives
// a token-scoped remote caller access to a function that already existed.
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

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const categorySlug = body?.categorySlug;
  const text = body?.text;
  const sources = body?.sources as Source[] | undefined;
  const verificationNote = body?.verificationNote;

  if (typeof categorySlug !== "string" || typeof text !== "string" || !Array.isArray(sources)) {
    return NextResponse.json(
      { ok: false, error: "Body must be { categorySlug: string, text: string, sources: Source[], verificationNote?: string }" },
      { status: 400 }
    );
  }
  if (verificationNote !== undefined && typeof verificationNote !== "string") {
    return NextResponse.json({ ok: false, error: "verificationNote must be a string if provided" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    return NextResponse.json({ ok: false, error: `Unknown category slug: ${categorySlug}` }, { status: 400 });
  }

  try {
    const created = await createFact(
      { text, categoryId: category.id, sources, verificationNote: verificationNote ?? null },
      "system"
    );
    const verified = await verifyFact(created.id, "system");
    return NextResponse.json({ ok: true, shareSlug: verified.shareSlug });
  } catch (e) {
    // Surfaces the exact spec 2.4/2.9 rejection reason (e.g. "At least one
    // source must be tier: primary") so the calling agent can find a better
    // source and retry, rather than a caller having to guess why it failed.
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}
