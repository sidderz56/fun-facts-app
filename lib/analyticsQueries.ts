// Product analytics query set (spec 5.8). Deliberately just queries against
// the Event/Session tables, not a platform — this is the "handful of
// queries" the spec calls for, grouped to match its four sections
// (Acquisition, Engagement, Content, Retention) plus the north star.
//
// "Session" throughout means "one anon_id's activity on one calendar day"
// (UTC) — the data model has no separate visit/session-timeout concept
// (spec 3.3's `sessions` table is the anon_id's whole 12-month lifetime,
// not a single visit), so a daily bucket is the closest usable proxy and
// keeps every session-shaped metric from growing monotonically over an
// anon_id's lifetime.
import { prisma } from "@/lib/db";

export type DateRange = { start: Date; end: Date };

function defaultRange(days = 30): DateRange {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end };
}

// ---------------------------------------------------------------------------
// North star
// ---------------------------------------------------------------------------

// spec 5.8: "average facts consumed per session... if exactly one number is
// tracked, it's this one." Facts-viewed-per-anon-id-per-day, averaged
// across every (anon_id, day) that had at least one view.
export async function northStarFactsPerSession(range: DateRange = defaultRange()): Promise<number> {
  const rows = await prisma.$queryRaw<{ avg_facts: number | null }[]>`
    SELECT AVG(views_per_day)::float AS avg_facts
    FROM (
      SELECT anon_id, DATE_TRUNC('day', created_at) AS day, COUNT(*) AS views_per_day
      FROM events
      WHERE type = 'fact_viewed' AND created_at BETWEEN ${range.start} AND ${range.end}
      GROUP BY anon_id, DATE_TRUNC('day', created_at)
    ) per_session
  `;
  return rows[0]?.avg_facts ?? 0;
}

// ---------------------------------------------------------------------------
// Acquisition
// ---------------------------------------------------------------------------

export async function uniqueVisitors(range: DateRange = defaultRange()): Promise<number> {
  return prisma.session.count({ where: { createdAt: { gte: range.start, lte: range.end } } });
}

// A returning visitor: any anon_id with activity on more than one distinct
// calendar day within the range.
export async function returningVisitors(range: DateRange = defaultRange()): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count FROM (
      SELECT anon_id
      FROM events
      WHERE created_at BETWEEN ${range.start} AND ${range.end}
      GROUP BY anon_id
      HAVING COUNT(DISTINCT DATE_TRUNC('day', created_at)) > 1
    ) multi_day
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function sharePageArrivals(range: DateRange = defaultRange()): Promise<number> {
  return prisma.event.count({
    where: { type: "share_page_arrival", createdAt: { gte: range.start, lte: range.end } },
  });
}

// spec 5.8: "share page -> first Another — the direct measure of whether
// 4.4 is working." Fraction of share-page arrivals whose anon_id logged a
// source='another' fact_viewed at any point after the arrival.
export async function sharePageConversionRate(range: DateRange = defaultRange()): Promise<number> {
  const rows = await prisma.$queryRaw<{ arrivals: bigint; converted: bigint }[]>`
    WITH arrivals AS (
      SELECT id, anon_id, created_at
      FROM events
      WHERE type = 'share_page_arrival' AND created_at BETWEEN ${range.start} AND ${range.end}
    )
    SELECT
      COUNT(*) AS arrivals,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM events e2
          WHERE e2.anon_id = arrivals.anon_id
            AND e2.type = 'fact_viewed'
            AND e2.source = 'another'
            AND e2.created_at > arrivals.created_at
        )
      ) AS converted
    FROM arrivals
  `;
  const row = rows[0];
  if (!row || Number(row.arrivals) === 0) return 0;
  return Number(row.converted) / Number(row.arrivals);
}

// ---------------------------------------------------------------------------
// Engagement
// ---------------------------------------------------------------------------

// Approximated as last-event-minus-first-event per (anon_id, day), in
// seconds, averaged. There's no explicit session-start/session-end event,
// so this undercounts a single-fact visit (duration 0) as much as it
// undercounts a session that ends mid-read — a documented approximation,
// not a precise timer.
export async function averageSessionDurationSeconds(range: DateRange = defaultRange()): Promise<number> {
  const rows = await prisma.$queryRaw<{ avg_seconds: number | null }[]>`
    SELECT AVG(EXTRACT(EPOCH FROM (max_t - min_t)))::float AS avg_seconds
    FROM (
      SELECT anon_id, DATE_TRUNC('day', created_at) AS day,
             MIN(created_at) AS min_t, MAX(created_at) AS max_t
      FROM events
      WHERE created_at BETWEEN ${range.start} AND ${range.end}
      GROUP BY anon_id, DATE_TRUNC('day', created_at)
    ) per_session
  `;
  return rows[0]?.avg_seconds ?? 0;
}

async function averageEventsPerSessionBySource(
  sources: string[],
  range: DateRange
): Promise<number> {
  const rows = await prisma.$queryRaw<{ avg_count: number | null }[]>`
    SELECT AVG(cnt)::float AS avg_count
    FROM (
      SELECT anon_id, DATE_TRUNC('day', created_at) AS day, COUNT(*) AS cnt
      FROM events
      WHERE type = 'fact_viewed'
        AND source = ANY(${sources}::"FactViewSource"[])
        AND created_at BETWEEN ${range.start} AND ${range.end}
      GROUP BY anon_id, DATE_TRUNC('day', created_at)
    ) per_session
  `;
  return rows[0]?.avg_count ?? 0;
}

export async function anotherTapsPerSession(range: DateRange = defaultRange()): Promise<number> {
  return averageEventsPerSessionBySource(["another"], range);
}

// "Category taps": the initial pick into a specific category from a tile —
// excludes Random, which is tracked separately below.
export async function categoryTapsPerSession(range: DateRange = defaultRange()): Promise<number> {
  return averageEventsPerSessionBySource(["tile"], range);
}

// spec 5.8: "share of sessions using Random vs. picking a category — the
// read on whether the category grid is earning its screen space at all."
export async function randomUsageShare(range: DateRange = defaultRange()): Promise<number> {
  const rows = await prisma.$queryRaw<{ used_random: bigint; used_tile: bigint }[]>`
    SELECT
      COUNT(*) FILTER (WHERE has_random) AS used_random,
      COUNT(*) FILTER (WHERE has_tile) AS used_tile
    FROM (
      SELECT anon_id, DATE_TRUNC('day', created_at) AS day,
             BOOL_OR(source = 'random') AS has_random,
             BOOL_OR(source = 'tile') AS has_tile
      FROM events
      WHERE type = 'fact_viewed' AND created_at BETWEEN ${range.start} AND ${range.end}
      GROUP BY anon_id, DATE_TRUNC('day', created_at)
    ) per_session
  `;
  const row = rows[0];
  const randomCount = Number(row?.used_random ?? 0);
  const tileCount = Number(row?.used_tile ?? 0);
  const total = randomCount + tileCount;
  return total === 0 ? 0 : randomCount / total;
}

export async function shareRate(range: DateRange = defaultRange()): Promise<number> {
  const [shares, views] = await Promise.all([
    prisma.event.count({ where: { type: "share_initiated", createdAt: { gte: range.start, lte: range.end } } }),
    prisma.event.count({ where: { type: "fact_viewed", createdAt: { gte: range.start, lte: range.end } } }),
  ]);
  return views === 0 ? 0 : shares / views;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export async function factsViewedByCategory(
  range: DateRange = defaultRange()
): Promise<{ categorySlug: string; views: number }[]> {
  const rows = await prisma.event.groupBy({
    by: ["categorySlug"],
    where: { type: "fact_viewed", createdAt: { gte: range.start, lte: range.end } },
    _count: { _all: true },
  });
  return rows
    .filter((r) => r.categorySlug !== null)
    .map((r) => ({ categorySlug: r.categorySlug as string, views: r._count._all }))
    .sort((a, b) => b.views - a.views);
}

// spec 5.8: "how often users hit the 4.3 states, per category and
// globally. Direct input to the 2.3 rebalancing decision." Rate = distinct
// users who exhausted the category / distinct users who viewed anything in
// it — "of everyone who engaged with this category, what fraction ran out
// of facts."
export async function exhaustionRatePerCategory(
  range: DateRange = defaultRange()
): Promise<{ categorySlug: string; rate: number }[]> {
  const rows = await prisma.$queryRaw<{ category_slug: string; viewers: bigint; exhausters: bigint }[]>`
    SELECT
      v.category_slug,
      COUNT(DISTINCT v.anon_id) AS viewers,
      COUNT(DISTINCT x.anon_id) AS exhausters
    FROM (
      SELECT DISTINCT anon_id, category_slug FROM events
      WHERE type = 'fact_viewed' AND category_slug IS NOT NULL AND category_slug != ''
        AND created_at BETWEEN ${range.start} AND ${range.end}
    ) v
    LEFT JOIN events x
      ON x.anon_id = v.anon_id AND x.category_slug = v.category_slug
      AND x.type = 'exhaustion_hit' AND x.exhaustion_scope = 'category'
      AND x.created_at BETWEEN ${range.start} AND ${range.end}
    GROUP BY v.category_slug
  `;
  return rows
    .map((r) => ({
      categorySlug: r.category_slug,
      rate: Number(r.viewers) === 0 ? 0 : Number(r.exhausters) / Number(r.viewers),
    }))
    .sort((a, b) => b.rate - a.rate);
}

export async function globalExhaustionRate(range: DateRange = defaultRange()): Promise<number> {
  const [viewers, exhausters] = await Promise.all([
    prisma.event
      .findMany({
        where: { type: "fact_viewed", createdAt: { gte: range.start, lte: range.end } },
        select: { anonId: true },
        distinct: ["anonId"],
      })
      .then((r) => r.length),
    prisma.event
      .findMany({
        where: {
          type: "exhaustion_hit",
          exhaustionScope: "all",
          createdAt: { gte: range.start, lte: range.end },
        },
        select: { anonId: true },
        distinct: ["anonId"],
      })
      .then((r) => r.length),
  ]);
  return viewers === 0 ? 0 : exhausters / viewers;
}

export async function reportRate(
  range: DateRange = defaultRange()
): Promise<{ overall: number; byCategory: { categorySlug: string; rate: number }[] }> {
  const [totalReports, totalViews, reportsByCategory, viewsByCategory] = await Promise.all([
    prisma.event.count({ where: { type: "report_submitted", createdAt: { gte: range.start, lte: range.end } } }),
    prisma.event.count({ where: { type: "fact_viewed", createdAt: { gte: range.start, lte: range.end } } }),
    prisma.event.groupBy({
      by: ["categorySlug"],
      where: { type: "report_submitted", createdAt: { gte: range.start, lte: range.end } },
      _count: { _all: true },
    }),
    prisma.event.groupBy({
      by: ["categorySlug"],
      where: { type: "fact_viewed", createdAt: { gte: range.start, lte: range.end } },
      _count: { _all: true },
    }),
  ]);

  const viewsMap = new Map(viewsByCategory.map((r) => [r.categorySlug, r._count._all]));
  const byCategory = reportsByCategory
    .filter((r) => r.categorySlug !== null)
    .map((r) => {
      const views = viewsMap.get(r.categorySlug) ?? 0;
      return { categorySlug: r.categorySlug as string, rate: views === 0 ? 0 : r._count._all / views };
    })
    .sort((a, b) => b.rate - a.rate);

  return { overall: totalViews === 0 ? 0 : totalReports / totalViews, byCategory };
}

export type FactEngagement = {
  shareSlug: string;
  text: string;
  categorySlug: string;
  qualityScore: number | null;
  views: number;
  fastBounceRate: number; // fraction of views followed by an "another" tap within 60s
  shareRate: number;
};

// spec 5.8: "highest- and lowest-engagement facts, measuring 'Another'
// immediately after view... and share rate. Cross-reference against
// quality_score — where editorial scoring and user behaviour disagree, the
// scoring rubric probably needs adjusting." fast_bounce here means the
// same anon_id's very next event was another fact_viewed with
// source='another' within 60 seconds — a proxy for "this fact didn't hold
// attention."
export async function factEngagement(
  range: DateRange = defaultRange(),
  limit = 10
): Promise<{ highest: FactEngagement[]; lowest: FactEngagement[] }> {
  const rows = await prisma.$queryRaw<
    {
      share_slug: string;
      views: bigint;
      fast_bounces: bigint;
      shares: bigint;
    }[]
  >`
    WITH viewed AS (
      SELECT id, anon_id, share_slug, created_at,
             LEAD(created_at) OVER (PARTITION BY anon_id ORDER BY created_at) AS next_t,
             LEAD(source) OVER (PARTITION BY anon_id ORDER BY created_at) AS next_source
      FROM events
      WHERE type = 'fact_viewed' AND share_slug IS NOT NULL
        AND created_at BETWEEN ${range.start} AND ${range.end}
    ),
    bounce AS (
      SELECT
        share_slug,
        COUNT(*) AS views,
        COUNT(*) FILTER (
          WHERE next_source = 'another' AND next_t IS NOT NULL
            AND EXTRACT(EPOCH FROM (next_t - created_at)) < 60
        ) AS fast_bounces
      FROM viewed
      GROUP BY share_slug
    ),
    shares AS (
      SELECT share_slug, COUNT(*) AS shares
      FROM events
      WHERE type = 'share_initiated' AND share_slug IS NOT NULL
        AND created_at BETWEEN ${range.start} AND ${range.end}
      GROUP BY share_slug
    )
    SELECT bounce.share_slug, bounce.views, bounce.fast_bounces, COALESCE(shares.shares, 0) AS shares
    FROM bounce
    LEFT JOIN shares ON shares.share_slug = bounce.share_slug
  `;

  if (rows.length === 0) return { highest: [], lowest: [] };

  const shareSlugs = rows.map((r) => r.share_slug);
  const facts = await prisma.fact.findMany({
    where: { shareSlug: { in: shareSlugs } },
    include: { category: true },
  });
  const factMap = new Map(facts.map((f) => [f.shareSlug, f]));

  const enriched: FactEngagement[] = rows
    .map((r) => {
      const fact = factMap.get(r.share_slug);
      if (!fact) return null; // this-day-in-history entries aren't in the Fact table
      const views = Number(r.views);
      return {
        shareSlug: r.share_slug,
        text: fact.text,
        categorySlug: fact.category.slug,
        qualityScore: fact.qualityScore,
        views,
        fastBounceRate: views === 0 ? 0 : Number(r.fast_bounces) / views,
        shareRate: views === 0 ? 0 : Number(r.shares) / views,
      };
    })
    .filter((e): e is FactEngagement => e !== null);

  // "Highest engagement" = low fast-bounce, high share rate; sort by a
  // simple composite (share rate minus bounce rate) rather than inventing
  // a weighted score — this is meant to surface outliers for a human to
  // look at, not to be the final word.
  const byComposite = [...enriched].sort(
    (a, b) => b.shareRate - b.fastBounceRate - (a.shareRate - a.fastBounceRate)
  );
  return {
    highest: byComposite.slice(0, limit),
    lowest: byComposite.slice(-limit).reverse(),
  };
}

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------

// Classic N-day retention: of sessions first active on `cohortDay`, what
// fraction have any event on exactly cohortDay + N.
async function retentionAtDay(cohortDay: Date, n: number): Promise<number> {
  const cohortStart = new Date(cohortDay);
  cohortStart.setUTCHours(0, 0, 0, 0);
  const cohortEnd = new Date(cohortStart.getTime() + 24 * 60 * 60 * 1000);

  const targetStart = new Date(cohortStart.getTime() + n * 24 * 60 * 60 * 1000);
  const targetEnd = new Date(targetStart.getTime() + 24 * 60 * 60 * 1000);

  const cohort = await prisma.session.findMany({
    where: { createdAt: { gte: cohortStart, lt: cohortEnd } },
    select: { anonId: true },
  });
  if (cohort.length === 0) return 0;

  const returned = await prisma.event.findMany({
    where: {
      anonId: { in: cohort.map((c) => c.anonId) },
      createdAt: { gte: targetStart, lt: targetEnd },
    },
    select: { anonId: true },
    distinct: ["anonId"],
  });

  return returned.length / cohort.length;
}

export async function nextDayReturnRate(cohortDay: Date): Promise<number> {
  return retentionAtDay(cohortDay, 1);
}

export async function sevenDayReturnRate(cohortDay: Date): Promise<number> {
  return retentionAtDay(cohortDay, 7);
}

export async function thirtyDayReturnRate(cohortDay: Date): Promise<number> {
  return retentionAtDay(cohortDay, 30);
}
