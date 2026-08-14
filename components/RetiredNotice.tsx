import Link from "next/link";

type RetiredNoticeProps = {
  category: { name: string; slug: string };
};

// A retired fact with no replacement written yet (spec 4.4). Still resolves
// — never a 404 — and still offers a way back into the core loop, mirroring
// the exhaustion states' shape rather than introducing a new one. Not part
// of the design handoff (which predates Phase 2's retired-fact handling) —
// styled to match its visual language rather than left unstyled.
export default function RetiredNotice({ category }: RetiredNoticeProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto p-6 text-center">
      <div className="flex max-w-[420px] flex-col gap-3">
        <p className="font-serif text-[26px]">This fact has been retired.</p>
        <p className="text-[15px] text-[var(--accent-muted)]">
          It didn&rsquo;t hold up on a re-check, so we pulled it rather than leave it here uncorrected.
        </p>
      </div>
      <div className="flex w-full max-w-[320px] flex-col gap-3">
        <a href={`/api/next-fact?category=${category.slug}`} className="btn-primary">
          Another
        </a>
        <Link href="/" className="text-sm font-semibold text-[var(--home-link)]">
          Home
        </Link>
      </div>
    </main>
  );
}
