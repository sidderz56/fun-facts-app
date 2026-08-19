// Prints the spec 5.8 query set against the last 30 days of real data.
// Run with: npm run analytics
import "dotenv/config";
import { prisma } from "../lib/db";
import * as q from "../lib/analyticsQueries";

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

async function main() {
  console.log("=== North star ===");
  console.log("Average facts consumed per session:", (await q.northStarFactsPerSession()).toFixed(2));

  console.log("\n=== Acquisition ===");
  console.log("Unique visitors (30d):", await q.uniqueVisitors());
  console.log("Returning visitors (30d):", await q.returningVisitors());
  console.log("Share-page arrivals (30d):", await q.sharePageArrivals());
  console.log("Share-page -> first Another conversion:", pct(await q.sharePageConversionRate()));

  console.log("\n=== Engagement ===");
  console.log("Avg session duration (s):", (await q.averageSessionDurationSeconds()).toFixed(1));
  console.log("Another taps per session:", (await q.anotherTapsPerSession()).toFixed(2));
  console.log("Category taps per session:", (await q.categoryTapsPerSession()).toFixed(2));
  console.log("Random usage share:", pct(await q.randomUsageShare()));
  console.log("Share rate (shares per fact view):", pct(await q.shareRate()));

  console.log("\n=== Content ===");
  const byCategory = await q.factsViewedByCategory();
  console.log("Facts viewed by category:");
  for (const row of byCategory) console.log(`  ${row.categorySlug || "(this day in history)"}: ${row.views}`);

  const exhaustionByCategory = await q.exhaustionRatePerCategory();
  console.log("Exhaustion rate by category:");
  for (const row of exhaustionByCategory) console.log(`  ${row.categorySlug}: ${pct(row.rate)}`);
  console.log("Global exhaustion rate:", pct(await q.globalExhaustionRate()));

  const reports = await q.reportRate();
  console.log("Report rate (overall):", pct(reports.overall));
  for (const row of reports.byCategory) console.log(`  ${row.categorySlug}: ${pct(row.rate)}`);

  const engagement = await q.factEngagement();
  console.log("Highest-engagement facts:");
  for (const f of engagement.highest) {
    console.log(
      `  [${f.categorySlug}] q=${f.qualityScore ?? "?"} views=${f.views} bounce=${pct(f.fastBounceRate)} share=${pct(f.shareRate)} — ${f.text.slice(0, 60)}...`
    );
  }
  console.log("Lowest-engagement facts:");
  for (const f of engagement.lowest) {
    console.log(
      `  [${f.categorySlug}] q=${f.qualityScore ?? "?"} views=${f.views} bounce=${pct(f.fastBounceRate)} share=${pct(f.shareRate)} — ${f.text.slice(0, 60)}...`
    );
  }

  console.log("\n=== Retention ===");
  const cohortDay = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
  console.log(`Cohort day: ${cohortDay.toISOString().slice(0, 10)}`);
  console.log("Next-day return rate:", pct(await q.nextDayReturnRate(cohortDay)));
  console.log("7-day return rate:", pct(await q.sevenDayReturnRate(cohortDay)));
  console.log("30-day return rate:", pct(await q.thirtyDayReturnRate(cohortDay)));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
