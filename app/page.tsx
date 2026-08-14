import { prisma } from "@/lib/db";
import { CATEGORY_DESIGN, categoryTileBg } from "@/lib/designTokens";
import { CategoryIcon, DiceIcon, RabbitIcon } from "@/components/icons";

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (
    // Full-viewport, no page scroll — the forced 5-column grid below always
    // fits all 10 tiles in exactly 2 rows regardless of viewport width.
    <main className="flex h-dvh w-full flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col box-border px-4 pt-7 pb-6">
        <div className="mb-6 text-center">
          <div className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
            Fun Facts
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="font-serif text-[26px] italic text-[var(--heading-serif)]">
              Choose your rabbit hole
            </span>
            <RabbitIcon />
          </div>
        </div>

        {/* No "this day in history" card yet — that's Phase 3 (spec 3.4, 4.1). */}
        <div className="grid flex-1 grid-cols-5 gap-[10px]">
          {/* Random tile is a distinct 10th tile, positioned first (spec 4.1).
              Plain <a>, not next/link's <Link>: tapping this picks + records a
              new fact server-side, so it must never be served from Next's
              client-side prefetch/router cache. */}
          <a
            href="/api/next-fact?category=random"
            className="tile"
            style={{ background: "var(--random-tile-bg)" }}
          >
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <DiceIcon />
            </div>
            <div className="text-center text-[13.5px] leading-[1.2] font-bold">Surprise me</div>
          </a>

          {categories.map((category) => {
            const design = CATEGORY_DESIGN[category.slug];
            return (
              <a
                key={category.id}
                href={`/api/next-fact?category=${category.slug}`}
                className="tile"
                style={{ background: categoryTileBg(design.hue) }}
              >
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <CategoryIcon shape={design.shape} />
                </div>
                <div className="text-center text-[13.5px] leading-[1.2] font-semibold">
                  {category.name}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
