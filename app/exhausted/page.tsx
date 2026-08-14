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
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
        <p className="max-w-md text-2xl font-semibold">
          You&rsquo;ve seen every fact in {category.name}! ✨
        </p>
        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          <a href={`/api/reshuffle?scope=category&category=${category.slug}`} className="action-button">
            Reshuffle
          </a>
          <Link href="/" className="action-button">
            Different Category
          </Link>
        </div>
      </main>
    );
  }

  // Global exhaustion (spec 4.3) — reachable via Random when the eligible
  // pool is empty, or by exhausting the last remaining category.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="max-w-md text-2xl font-semibold">You&rsquo;ve seen every fact on the site! ✨</p>
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <a href="/api/reshuffle?scope=all" className="action-button w-full">
          Reshuffle Everything
        </a>
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
      </div>
    </main>
  );
}
