import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ANON_ID_COOKIE } from "@/lib/constants";

// middleware.ts sets the anon_id cookie on every request before this ever
// runs, so it should always be present. This function's job is just to make
// sure the matching `sessions` row exists (spec 3.3) — created on first read
// rather than in middleware, since middleware runs on the Edge runtime and
// can't hold a Postgres connection.
export async function getOrCreateSession() {
  const cookieStore = await cookies();
  const anonId = cookieStore.get(ANON_ID_COOKIE)?.value;

  if (!anonId) {
    throw new Error("anon_id cookie missing — middleware should have set it");
  }

  return prisma.session.upsert({
    where: { anonId },
    update: { lastActiveAt: new Date() },
    create: { anonId },
  });
}

// Appends factId to seen_fact_ids if it isn't already there. currentSeen is
// passed in (rather than re-read) since callers already have it from
// getOrCreateSession — avoids an extra round trip on every fact view.
export async function markFactSeen(anonId: string, factId: string, currentSeen: string[]) {
  if (currentSeen.includes(factId)) return;

  await prisma.session.update({
    where: { anonId },
    data: {
      seenFactIds: { push: factId },
      lastActiveAt: new Date(),
    },
  });
}
