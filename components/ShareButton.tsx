"use client";

import { useState } from "react";

type ShareButtonProps = {
  shareSlug: string;
  shareTitle: string;
};

// Native Web Share API where available (mobile); fallback icon row (copy
// link, X/Twitter) on desktop and unsupported browsers (spec 4.4). The menu
// branch only ever renders after a client click, so referencing window here
// carries no SSR/hydration-mismatch risk.
export default function ShareButton({ shareSlug, shareTitle }: ShareButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  function shareUrl() {
    return `${window.location.origin}/fact/${shareSlug}`;
  }

  async function handleClick() {
    if (typeof navigator.share === "function") {
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
      <button type="button" onClick={handleClick} className="action-button w-full">
        Share
      </button>
      {menuOpen && (
        <div className="absolute bottom-full left-0 z-10 mb-2 flex w-full min-w-max flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-2 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <button
            type="button"
            onClick={handleCopy}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {copied ? "Copied!" : copyFailed ? "Couldn't copy" : "Copy link"}
          </button>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl())}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Share on X
          </a>
        </div>
      )}
    </div>
  );
}
