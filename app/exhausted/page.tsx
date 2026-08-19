import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrCreateSession } from "@/lib/session";
import { logEvent } from "@/lib/eventCapture";

type ExhaustedPageProps = {
  searchParams: Promise<{ scope?: string; category?: string }>;
};

export default async function ExhaustedPage({ searchParams }: ExhaustedPageProps) {
  const { scope, category: categorySlug } = await searchParams;
  const session = await getOrCreateSession();

  if (scope === "category" && categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) notFound();

    // spec 5.8: "exhaustion rate — how often users hit the 4.3 states, per
    // category and globally" — feeds the 2.3 rebalancing decision.
    await logEvent({
      anonId: session.anonId,
      type: "exhaustion_hit",
      categorySlug: category.slug,
      exhaustionScope: "category",
    });

    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto p-6 text-center">
        <p className="max-w-[420px] font-serif text-[26px]">
          You&rsquo;ve seen every fact in {category.name}.
        </p>
        <div className="flex w-full max-w-[320px] flex-col gap-3">
          <a href={`/api/reshuffle?scope=category&category=${category.slug}`} className="btn-primary">
            Reshuffle this category
          </a>
          <Link href="/" className="btn-secondary text-center">
            Different category
          </Link>
        </div>
      </main>
    );
  }

  // Global exhaustion (spec 4.3) — reachable via Random when the eligible
  // pool is empty, or by exhausting the last remaining category.
  await logEvent({ anonId: session.anonId, type: "exhaustion_hit", exhaustionScope: "all" });

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto p-6 text-center">
      <p className="max-w-[420px] font-serif text-[26px]">You&rsquo;ve seen every fact on the site.</p>
      <div className="flex w-full max-w-[320px] flex-col gap-3">
        <a href="/api/reshuffle?scope=all" className="btn-primary">
          Reshuffle everything
        </a>
        <Link href="/" className="text-sm font-semibold text-[var(--home-link)]">
          Home
        </Link>
      </div>
    </main>
  );
}
