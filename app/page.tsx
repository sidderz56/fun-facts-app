import { prisma } from "@/lib/db";

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-center text-2xl font-bold">Fun Facts</h1>

      {/* No "this day in history" card yet — that's Phase 3 (spec 3.4, 4.1). */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Random tile is a distinct 10th tile, positioned first (spec 4.1).
            Plain <a>, not next/link's <Link>: tapping this picks + records a
            new fact server-side, so it must never be served from Next's
            client-side prefetch/router cache. */}
        <a href="/api/next-fact?category=random" className="grid-tile grid-tile-random">
          <span className="text-3xl">🎲</span>
          <span>Random</span>
        </a>

        {categories.map((category) => (
          <a
            key={category.id}
            href={`/api/next-fact?category=${category.slug}`}
            className="grid-tile"
          >
            <span className="text-3xl">{category.iconAsset}</span>
            <span>{category.name}</span>
          </a>
        ))}
      </div>
    </main>
  );
}
