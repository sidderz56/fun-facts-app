import Link from "next/link";

type RetiredNoticeProps = {
  category: { name: string; slug: string };
};

// A retired fact with no replacement written yet (spec 4.4). Still resolves
// — never a 404 — and still offers a way back into the core loop, mirroring
// the exhaustion states' shape rather than introducing a new one.
export default function RetiredNotice({ category }: RetiredNoticeProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="max-w-md text-2xl font-semibold">This fact has been retired.</p>
      <p className="max-w-md text-zinc-500 dark:text-zinc-400">
        It didn&rsquo;t hold up on a re-check, so we pulled it rather than leave it here uncorrected.
      </p>
      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        <a href={`/api/next-fact?category=${category.slug}`} className="action-button">
          Another
        </a>
        <Link href="/" className="action-button">
          Home
        </Link>
      </div>
    </main>
  );
}
