import Link from "next/link";
import type { FactLengthClass } from "@/lib/textMetrics";
import AnotherButton from "@/components/AnotherButton";
import ShareButton from "@/components/ShareButton";
import { ogTitle } from "@/lib/ogText";

type FactViewProps = {
  fact: {
    text: string;
    factLengthClass: FactLengthClass | null;
    shareSlug: string;
  };
  category: {
    name: string;
    slug: string;
  };
  // Shown as a small banner above the fact text — used when this fact's
  // content is actually a superseding replacement for a retired fact
  // (spec 4.4).
  note?: string;
};

// Type size band picked from fact_length_class rather than auto-fitting
// arbitrary text (spec 2.9, 4.2). Sizes from the design handoff.
const SIZE_CLASSES: Record<FactLengthClass, string> = {
  short: "text-[38px] font-medium leading-[1.3]",
  medium: "text-[30px] font-medium leading-[1.35]",
  long: "text-[24px] font-medium leading-[1.4]",
};

export default function FactView({ fact, category, note }: FactViewProps) {
  const sizeClass = SIZE_CLASSES[fact.factLengthClass ?? "medium"];

  return (
    <main className="box-border mx-auto flex w-full max-w-[720px] flex-1 flex-col overflow-y-auto">
      <div className="px-6 pt-[22px]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-muted)]"
        >
          <span>&larr;</span>
          <span>{category.name}</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 pt-8 pb-10">
        {note && (
          <p
            className="rounded-full px-4 py-1 text-sm font-medium"
            style={{ background: "var(--random-tile-bg)", color: "var(--text-body)" }}
          >
            {note}
          </p>
        )}
        <p className={`max-w-[560px] text-center font-serif ${sizeClass}`}>{fact.text}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 pb-8">
        <AnotherButton categorySlug={category.slug} />
        <Link href="/" className="btn-secondary text-center">
          Different category
        </Link>
        <ShareButton shareSlug={fact.shareSlug} shareTitle={ogTitle(fact.text)} />
        <Link href="/" className="btn-secondary text-center">
          Home
        </Link>
      </div>
    </main>
  );
}
