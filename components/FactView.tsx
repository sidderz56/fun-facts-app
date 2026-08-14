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
// arbitrary text (spec 2.9, 4.2).
const SIZE_CLASSES: Record<FactLengthClass, string> = {
  short: "text-4xl sm:text-5xl",
  medium: "text-3xl sm:text-4xl",
  long: "text-2xl sm:text-3xl",
};

export default function FactView({ fact, category, note }: FactViewProps) {
  const sizeClass = SIZE_CLASSES[fact.factLengthClass ?? "medium"];

  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <div className="p-4">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          {category.name}
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8">
        {note && (
          <p className="rounded-full bg-amber-100 px-4 py-1 text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {note}
          </p>
        )}
        <p className={`max-w-2xl text-center font-semibold leading-snug ${sizeClass}`}>
          {fact.text}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <AnotherButton categorySlug={category.slug} />
        <Link href="/" className="action-button">
          Different Category
        </Link>
        <ShareButton shareSlug={fact.shareSlug} shareTitle={ogTitle(fact.text)} />
        <Link href="/" className="action-button">
          Home
        </Link>
      </div>
    </main>
  );
}
