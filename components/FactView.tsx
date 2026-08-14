import Link from "next/link";
import type { FactLengthClass } from "@/lib/textMetrics";

type FactViewProps = {
  fact: {
    text: string;
    factLengthClass: FactLengthClass | null;
  };
  category: {
    name: string;
    slug: string;
  };
};

// Type size band picked from fact_length_class rather than auto-fitting
// arbitrary text (spec 2.9, 4.2).
const SIZE_CLASSES: Record<FactLengthClass, string> = {
  short: "text-4xl sm:text-5xl",
  medium: "text-3xl sm:text-4xl",
  long: "text-2xl sm:text-3xl",
};

export default function FactView({ fact, category }: FactViewProps) {
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

      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <p className={`max-w-2xl text-center font-semibold leading-snug ${sizeClass}`}>
          {fact.text}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {/* Plain <a>, not next/link's <Link>: this is a side-effecting request
            (picks + records a new fact), so it must never be served from
            Next's client-side prefetch/router cache — every tap needs a
            fresh server hit. */}
        <a href={`/api/next-fact?category=${category.slug}`} className="action-button">
          Another
        </a>
        <Link href="/" className="action-button">
          Different Category
        </Link>
        {/* TODO(phase2): wire up Web Share API + fallback icon row (spec 4.4) */}
        <button type="button" disabled title="Coming in a later phase" className="action-button-disabled">
          Share
        </button>
        <Link href="/" className="action-button">
          Home
        </Link>
      </div>
    </main>
  );
}
