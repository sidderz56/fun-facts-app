import { getReverificationQueue, getReportQueue } from "@/lib/adminQueries";
import { markReviewedAction, confirmReverificationAction } from "@/lib/adminActions";
import FactActionsPanel from "@/components/admin/FactActionsPanel";

// spec 5.7: "Two lists... Checked once per day." Combined on a single page
// rather than separate routes — this is a single internal tool for one
// operator, not a multi-page app, and spec doesn't call for separate URLs.
export default async function AdminDashboardPage() {
  const [reverificationQueue, reportQueue] = await Promise.all([
    getReverificationQueue(),
    getReportQueue(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Due for re-verification <span className="font-normal text-sm">({reverificationQueue.length})</span>
        </h2>
        {reverificationQueue.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--home-link)" }}>
            Nothing due.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {reverificationQueue.map((fact) => (
              <li key={fact.id} className="rounded-xl p-4" style={{ background: "var(--btn-secondary-bg)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--accent-muted)" }}>
                  {fact.category.name} &middot; due {fact.reverificationDueDate?.toISOString().slice(0, 10)} &middot;{" "}
                  cadence: {fact.reverificationCadence}
                </div>
                <p className="mt-1">{fact.text}</p>

                <form action={confirmReverificationAction} className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <input type="hidden" name="factId" value={fact.id} />
                  <span className="font-medium">Confirm re-verification:</span>
                  {fact.reverificationCadence === "custom" && (
                    <input type="date" name="explicitDueDate" required className="rounded border px-2 py-1" />
                  )}
                  <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                    Confirm
                  </button>
                </form>

                <FactActionsPanel fact={fact} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Open report queue <span className="font-normal text-sm">({reportQueue.length})</span>
        </h2>
        {reportQueue.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--home-link)" }}>
            No open reports.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {reportQueue.map((fact) => {
              const autoPulled = !fact.active && fact.retiredReason === null;
              return (
                <li key={fact.id} className="rounded-xl p-4" style={{ background: "var(--btn-secondary-bg)" }}>
                  <div className="text-xs font-semibold" style={{ color: "var(--accent-muted)" }}>
                    {fact.category.name} &middot; {fact.reportsSinceReview} open report
                    {fact.reportsSinceReview === 1 ? "" : "s"}
                    {autoPulled && (
                      <span className="ml-2 rounded-full px-2 py-0.5" style={{ background: "var(--random-tile-bg)" }}>
                        auto-pulled
                      </span>
                    )}
                  </div>
                  <p className="mt-1">{fact.text}</p>

                  <form action={markReviewedAction.bind(null, fact.id)} className="mt-3">
                    <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                      Mark reviewed
                    </button>
                  </form>

                  <FactActionsPanel fact={fact} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
