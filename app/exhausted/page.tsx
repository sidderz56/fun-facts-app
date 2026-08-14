import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

type ExhaustedPageProps = {
  searchParams: Promise<{ scope?: string; category?: string }>;
};

export default async function ExhaustedPage({ searchParams }: ExhaustedPageProps) {
  const { scope, category: categorySlug } = await searchParams;

  if (scope === "category" && categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) notFound();

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
