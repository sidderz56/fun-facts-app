"use client";

import { useEffect, useState } from "react";

type AnotherButtonProps = {
  categorySlug: string;
};

// Fires a background prefetch as soon as the fact-view screen renders, then
// points "Another" straight at the result so the tap feels instant (spec
// 5.1) instead of round-tripping through /api/next-fact. If the prefetch
// hasn't resolved yet (rare) or the category turns out to be exhausted, it
// falls back to the slower-but-authoritative path, which handles both cases
// correctly on its own.
export default function AnotherButton({ categorySlug }: AnotherButtonProps) {
  const [prefetchedSlug, setPrefetchedSlug] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // No need to reset prefetchedSlug here: every navigation in this app is
    // a full page load (see the window.location.href note below), so this
    // component always mounts fresh with categorySlug already correct.
    let cancelled = false;

    fetch(`/api/prefetch-next?category=${categorySlug}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { slug: string | null }) => {
        if (!cancelled) setPrefetchedSlug(data.slug);
      })
      .catch(() => {
        // Silently fall back to the non-instant path — nothing to recover.
      });

    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  function handleClick() {
    if (prefetchedSlug) {
      // Deliberately a full navigation, not next/navigation's router. This
      // URL is unique per prefetch so there's no router-cache risk, but the
      // fallback below shares this handler's shape and does need a full
      // navigation, so both stay consistent.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/fact/${prefetchedSlug}`;
      return;
    }
    // Rare cache-miss: show a brief loading state instead of an instant
    // transition (spec 5.1) while the authoritative path resolves. This
    // target URL is NOT unique per click, so it must stay a full navigation
    // — router.push() here would reintroduce the router-cache bug.
    setPending(true);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/next-fact?category=${categorySlug}`;
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className="action-button">
      {pending ? "Loading…" : "Another"}
    </button>
  );
}
