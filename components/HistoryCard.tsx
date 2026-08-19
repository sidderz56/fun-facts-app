"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HistoryCardProps = {
  shareSlug: string;
  text: string;
  // Full-width on a user's first visit that day; the server already knows
  // this from the session's last_history_fact_shown_date (spec 3.3, 4.1),
  // so a returning-same-day visit renders collapsed from the start with no
  // client logic needed for that case.
  initiallyExpanded: boolean;
};

const COLLAPSE_DELAY_MS = 60_000;

// Collapses to a small persistent tile after 60s since the user's FIRST
// interaction (not page load) with any part of the page — spec 4.1. The
// other collapse trigger, "navigates away and returns," doesn't need any
// client logic at all: by the time they're back, the server has already
// marked today as shown, so this component mounts with
// initiallyExpanded=false directly.
export default function HistoryCard({ shareSlug, text, initiallyExpanded }: HistoryCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  useEffect(() => {
    if (!expanded) return;

    // `started` is local to this effect invocation, not a ref: it must
    // reset cleanly every time the effect re-runs (including React Strict
    // Mode's dev-only double-invoke), otherwise a throwaway first run that
    // happens to catch an event can permanently poison a ref-based guard
    // and silently suppress the real timer on the second, real mount.
    let started = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const events: Array<keyof WindowEventMap> = ["pointerdown", "scroll", "touchstart", "keydown"];

    function startTimerOnce() {
      if (started) return;
      started = true;
      // 60s since first interaction, not since page load (spec 4.1).
      timeoutId = setTimeout(() => setExpanded(false), COLLAPSE_DELAY_MS);
      events.forEach((event) => window.removeEventListener(event, startTimerOnce));
    }

    events.forEach((event) => window.addEventListener(event, startTimerOnce, { passive: true }));

    return () => {
      events.forEach((event) => window.removeEventListener(event, startTimerOnce));
      clearTimeout(timeoutId);
    };
  }, [expanded]);

  // src=tile: this is a Home-screen tap into a specific fact, same bucket
  // as a category tile for spec 5.8's fact_viewed source. Without it, the
  // fact page's default (no src param = share_page arrival) would
  // misclassify every history-card tap as an external share visit.
  const href = `/fact/${shareSlug}?src=tile`;

  if (!expanded) {
    return (
      <Link
        href={href}
        className="mb-4 flex items-center gap-2 rounded-2xl px-4 py-3"
        style={{ background: "var(--btn-secondary-bg)" }}
      >
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
          On this day
        </span>
        <span className="truncate text-sm text-[var(--accent-muted)]">{text}</span>
      </Link>
    );
  }

  return (
    <Link href={href} className="mb-4 block rounded-[18px] p-5" style={{ background: "var(--random-tile-bg)" }}>
      <div className="mb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
        On this day
      </div>
      <p className="font-serif text-[19px] leading-snug text-[var(--text-body)]">{text}</p>
    </Link>
  );
}
