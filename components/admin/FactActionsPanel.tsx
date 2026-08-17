import type { Fact, Category } from "@/app/generated/prisma/client";
import {
  retireFactAction,
  restoreFactAction,
  editFactTextAction,
  rescoreFactAction,
} from "@/lib/adminActions";

const RETIRED_REASONS = ["became_false", "became_ambiguous", "report_upheld", "superseded", "other"] as const;

// spec 5.7's full write-action set, minus "mark reviewed" (report-queue-only,
// rendered by the page itself) and "confirm re-verification"
// (reverification-queue-only, same). These three (retire / restore / edit
// text / re-score) apply to a fact in either queue, so they're shared here.
export default function FactActionsPanel({ fact }: { fact: Fact & { category: Category } }) {
  return (
    <div className="mt-3 flex flex-col gap-3 border-t pt-3 text-sm" style={{ borderColor: "var(--btn-secondary-bg)" }}>
      {fact.active ? (
        <form action={retireFactAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="factId" value={fact.id} />
          <span className="font-medium">Retire:</span>
          <select name="retiredReason" required className="rounded border px-2 py-1">
            {RETIRED_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="reason"
            required
            placeholder="Reason (required)"
            className="min-w-[180px] flex-1 rounded border px-2 py-1"
          />
          <input
            type="text"
            name="supersededByShareSlug"
            placeholder="Superseded-by slug (optional)"
            className="w-[200px] rounded border px-2 py-1"
          />
          <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
            Retire
          </button>
        </form>
      ) : (
        <form action={restoreFactAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="factId" value={fact.id} />
          <span className="font-medium">Restore:</span>
          <input
            type="text"
            name="reason"
            required
            placeholder="Reason (required)"
            className="min-w-[180px] flex-1 rounded border px-2 py-1"
          />
          <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
            Restore
          </button>
        </form>
      )}

      <form action={editFactTextAction} className="flex flex-col gap-2">
        <input type="hidden" name="factId" value={fact.id} />
        <span className="font-medium">Edit text:</span>
        <textarea
          name="newText"
          defaultValue={fact.text}
          required
          rows={3}
          className="rounded border px-2 py-1"
        />
        <div className="flex gap-2">
          <input
            type="text"
            name="reason"
            required
            placeholder="Reason (required)"
            className="min-w-[180px] flex-1 rounded border px-2 py-1"
          />
          <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
            Save edit
          </button>
        </div>
      </form>

      <form action={rescoreFactAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="factId" value={fact.id} />
        <span className="font-medium">Quality score:</span>
        <select name="newScore" defaultValue={fact.qualityScore ?? 3} className="rounded border px-2 py-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
          Save score
        </button>
      </form>
    </div>
  );
}
