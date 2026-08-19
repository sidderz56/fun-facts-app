"use client";

import { useSyncExternalStore } from "react";

const DISMISSED_KEY = "cookie-notice-dismissed";

function subscribe(callback: () => void) {
  // The native "storage" event only fires in *other* tabs, never the tab
  // that made the write — handleDismiss below dispatches one manually so
  // this same tab's snapshot re-check actually fires too.
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): boolean {
  return localStorage.getItem(DISMISSED_KEY) === "1";
}

// Server has no localStorage at all, so the SSR/first-hydration snapshot is
// always "not dismissed" — matches this component's own default-hidden-
// until-checked behavior, just expressed as the required third argument
// instead of an effect.
function getServerSnapshot(): boolean {
  return false;
}

// spec 5.2: "A standard cookie-notice banner is required for compliance
// even though no PII is collected, since a persistent identifier is being
// set." This is a NOTICE, not a consent gate — anon_id is already set by
// proxy.ts on the very first request, before this component ever mounts,
// because it's essential to the product working at all (no accounts, no
// PII, but the no-repeat loop needs *some* identity). There's nothing to
// opt out of, so this only ever has a dismiss action, never a decline path.
//
// Reads localStorage (a browser-only external store, unknown at SSR time)
// via useSyncExternalStore rather than useEffect+setState — the
// React-recommended shape for syncing with a system outside React's own
// state, and avoids the render-then-immediately-re-render flash that a
// bare effect would need a second pass to fix.
export default function CookieBanner() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    // The native "storage" event doesn't fire in the tab that made the
    // write, so it's dispatched manually to make subscribe()'s listener
    // (and therefore this component's re-render) fire in this tab too.
    window.dispatchEvent(new Event("storage"));
  }

  if (dismissed) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-center"
      style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
      role="region"
      aria-label="Cookie notice"
    >
      <p className="max-w-[560px] text-center text-sm sm:text-left">
        This site uses one cookie to remember which facts you&rsquo;ve seen, so we don&rsquo;t repeat
        them. No personal data, no accounts, no third-party tracking.
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold"
        style={{ background: "var(--btn-secondary-bg)", color: "var(--btn-secondary-text)" }}
      >
        Got it
      </button>
    </div>
  );
}
