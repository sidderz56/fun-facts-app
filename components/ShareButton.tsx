"use client";

import { useState } from "react";

type ShareButtonProps = {
  shareSlug: string;
  shareTitle: string;
  categorySlug: string;
};

// Native Web Share API where available (mobile); fallback icon row (copy
// link, X/Twitter) on desktop and unsupported browsers (spec 4.4). The menu
// branch only ever renders after a client click, so referencing window here
// carries no SSR/hydration-mismatch risk.
export default function ShareButton({ shareSlug, shareTitle, categorySlug }: ShareButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  function shareUrl() {
    return `${window.location.origin}/fact/${shareSlug}`;
  }

  // spec 5.8's "share initiated" — logged the moment a share action is
  // taken (native sheet opened, link copied, X intent opened), not
  // conditioned on whether the recipient ever actually opens the link.
  // Fire-and-forget: a failed ping should never block or error the share
  // itself.
  function logShareInitiated() {
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareSlug, categorySlug }),
      keepalive: true,
    }).catch(() => {});
  }

  async function handleClick() {
    if (typeof navigator.share === "function") {
      logShareInitiated();
      try {
        await navigator.share({ title: shareTitle, url: shareUrl() });
      } catch {
        // User dismissed the native share sheet — nothing to recover.
      }
      return;
    }
    setMenuOpen((open) => !open);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      logShareInitiated();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by browser policy even after a
      // direct user click — surface that instead of failing silently.
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 1500);
    }
  }

  return (
    <div className="relative">
      <button type="button" onClick={handleClick} className="btn-secondary w-full">
        Share
      </button>
      {menuOpen && (
        <div
          className="absolute bottom-full left-0 z-10 mb-2 flex w-full min-w-max flex-col gap-1 rounded-xl p-2 text-sm shadow-lg"
          style={{ background: "var(--page-bg)", border: "1px solid var(--btn-secondary-bg)" }}
        >
          <button
            type="button"
            onClick={handleCopy}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-left hover:bg-[var(--btn-secondary-bg)]"
          >
            {copied ? "Copied!" : copyFailed ? "Couldn't copy" : "Copy link"}
          </button>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl())}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              logShareInitiated();
              setMenuOpen(false);
            }}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-left hover:bg-[var(--btn-secondary-bg)]"
          >
            Share on X
          </a>
        </div>
      )}
    </div>
  );
}
