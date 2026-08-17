"use client";

import { useState } from "react";

type ReportButtonProps = {
  factId: string;
};

// spec 5.3: "a small 'Report' affordance on the fact-view screen... one tap,
// zero typing." Deliberately NOT one of the four equal-weight action
// buttons — low prominence is part of the spec, so this renders as a small
// text link below the button grid instead of joining it.
export default function ReportButton({ factId }: ReportButtonProps) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function handleClick() {
    if (state !== "idle") return;
    setState("sending");
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factId }),
      });
    } catch {
      // Best-effort — no retry UI. Whether this landed or not, the tap is
      // idempotent server-side, and there's nothing useful to show beyond
      // acknowledging the tap either way (spec 5.3).
    }
    setState("sent");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state !== "idle"}
      className="mx-auto block text-xs font-medium"
      style={{ color: "var(--home-link)" }}
    >
      {state === "sent" ? "Reported — thanks" : "Report this fact"}
    </button>
  );
}
