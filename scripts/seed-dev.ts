// Dev seed script (spec 2.1, plan Phase 0 deliverables; Phase 4 routes facts
// through the real create/verify mutation layer).
// Inserts the 9 categories with their target proportions, plus 5 obviously-
// placeholder facts each (45 total), spanning the short/medium/long word-count
// bands so fact-view typography can be evaluated honestly.
//
// Do NOT put real fun facts here — real content comes from the editorial
// pipeline in spec 2.3/2.4, which is out of scope for this build.
//
// Run with: npm run seed

import "dotenv/config";
import { prisma } from "../lib/db";
import { countWords } from "../lib/textMetrics";
import { generateShareSlug } from "../lib/shareSlug";
import { getMonthDay } from "../lib/historyCore";
import { createFact, verifyFact } from "../lib/factMutations";
import { canReachVerified, type Source } from "../lib/verification";

type CategorySeed = {
  name: string;
  slug: string;
  iconAsset: string;
  targetProportion: number;
  displayOrder: number;
};

// Target shares from spec 2.1. icon_asset is a placeholder emoji glyph —
// real icons are an open item (spec 6), resolved in Phase 8.
const CATEGORIES: CategorySeed[] = [
  { name: "History", slug: "history", iconAsset: "🏛️", targetProportion: 0.17, displayOrder: 1 },
  { name: "Science", slug: "science", iconAsset: "🔬", targetProportion: 0.15, displayOrder: 2 },
  { name: "Animals & Nature", slug: "animals-nature", iconAsset: "🐾", targetProportion: 0.13, displayOrder: 3 },
  { name: "Geography", slug: "geography", iconAsset: "🌍", targetProportion: 0.11, displayOrder: 4 },
  { name: "Human Body & Mind", slug: "human-body-mind", iconAsset: "🧠", targetProportion: 0.10, displayOrder: 5 },
  { name: "Words & Language", slug: "words-language", iconAsset: "📝", targetProportion: 0.09, displayOrder: 6 },
  { name: "Food & Drink", slug: "food-drink", iconAsset: "🍽️", targetProportion: 0.09, displayOrder: 7 },
  { name: "Pop Culture & Entertainment", slug: "pop-culture-entertainment", iconAsset: "🎬", targetProportion: 0.08, displayOrder: 8 },
  { name: "Money & Business", slug: "money-business", iconAsset: "💰", targetProportion: 0.08, displayOrder: 9 },
];

// 5 facts per category, body word counts chosen to spread across
// short (<=25) / medium (26-40) / long (41+) once the placeholder prefix
// is added on top.
const BODY_WORD_TARGETS = [14, 20, 28, 34, 48];

const FILLER_WORDS = [
  "This", "placeholder", "fact", "exists", "only", "to", "test", "how", "the",
  "fact-view", "screen", "renders", "text", "of", "different", "lengths",
  "before", "any", "real", "editorial", "content", "has", "been", "written",
  "for", "the", "site,", "and", "it", "will", "be", "replaced", "entirely",
  "during", "the", "content", "seeding", "phase", "described", "in", "the",
  "product", "spec,", "so", "nobody", "should", "mistake", "it", "for", "a",
  "genuine", "fun", "fact", "sitting", "in", "roughly", "this", "length",
  "band", "so", "type", "sizing", "can", "be", "judged", "honestly.",
];

// Obviously-fake but structurally valid (spec 2.4: >=2 sources, >=1
// primary) — lets placeholder facts actually pass the same verification
// gate real content will have to pass, rather than bypassing it.
const PLACEHOLDER_SOURCES: Source[] = [
  {
    url: "https://example.gov/placeholder-primary-source",
    name: "Example.gov (placeholder primary source)",
    accessedDate: "2026-01-01",
    tier: "primary",
  },
  {
    url: "https://example.com/placeholder-secondary-source",
    name: "Example.com (placeholder secondary source)",
    accessedDate: "2026-01-01",
    tier: "secondary",
  },
];

const PLACEHOLDER_NOTE = "Seed placeholder — not real editorial content.";

function placeholderBody(targetWords: number): string {
  const words: string[] = [];
  for (let i = 0; i < targetWords; i++) {
    words.push(FILLER_WORDS[i % FILLER_WORDS.length]);
  }
  return words.join(" ");
}

function placeholderText(categoryName: string, index: number, targetWords: number): string {
  return `[PLACEHOLDER ${categoryName} ${index}] ${placeholderBody(targetWords)}`;
}

// A handful of this_day_in_history entries (spec 3.4, plan Phase 3) — enough
// to exercise the real cases, not the full 366-day coverage that's a launch
// (Phase 8) task:
// - today's actual date, so the dev home card always has something to show
// - one date with two candidates, so year-over-year rotation is testable
// - one date with a single candidate, the common case
function buildHistorySeeds(): { monthDay: string; text: string }[] {
  return [
    {
      monthDay: getMonthDay(),
      text: "[PLACEHOLDER This Day 1] A placeholder this-day-in-history fact for today's date, seeded dynamically so the home card always has something to show in dev.",
    },
    {
      monthDay: "01-01",
      text: "[PLACEHOLDER This Day 2a] First of two placeholder candidates for January 1st, seeded so year-over-year rotation between candidates can be tested.",
    },
    {
      monthDay: "01-01",
      text: "[PLACEHOLDER This Day 2b] Second of two placeholder candidates for January 1st, seeded so year-over-year rotation between candidates can be tested.",
    },
    {
      monthDay: "07-04",
      text: "[PLACEHOLDER This Day 3] A single placeholder candidate for July 4th, to check the single-entry-per-date case still works cleanly.",
    },
  ];
}

async function main() {
  console.log("Seeding app config...");
  // spec 5.3: the auto-pull threshold lives in config, not code, so it can
  // be edited without a deploy — upsert rather than create so a re-run
  // never clobbers a value someone has since tuned in production.
  await prisma.appConfig.upsert({
    where: { key: "auto_pull_threshold" },
    update: {},
    create: { key: "auto_pull_threshold", value: "3" },
  });

  console.log("Seeding categories...");
  const categoryRecords = [];
  for (const c of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        iconAsset: c.iconAsset,
        targetProportion: c.targetProportion,
        displayOrder: c.displayOrder,
      },
      create: c,
    });
    categoryRecords.push(record);
  }

  console.log("Seeding placeholder facts...");
  let factCount = 0;
  for (const category of categoryRecords) {
    // Wipe this category's placeholder facts (and their revisions, via
    // cascade) first so re-running the script is idempotent instead of
    // piling up duplicates. Scoped to the "[PLACEHOLDER" text prefix so this
    // never touches real content — this hard-delete is a dev-only reset for
    // fixture data specifically; the app's own code (lib/factMutations.ts)
    // never deletes a Fact at all (spec 3.5).
    await prisma.fact.deleteMany({
      where: { categoryId: category.id, text: { startsWith: "[PLACEHOLDER" } },
    });

    for (let i = 0; i < BODY_WORD_TARGETS.length; i++) {
      const text = placeholderText(category.name, i + 1, BODY_WORD_TARGETS[i]);

      // Real create -> verify flow (spec 2.4 steps 1 & 3), same path real
      // content will use — proves the Phase 4 gate actually accepts
      // well-formed data instead of just rejecting bad data.
      const created = await createFact(
        {
          text,
          categoryId: category.id,
          sources: PLACEHOLDER_SOURCES,
          verificationNote: PLACEHOLDER_NOTE,
        },
        "system"
      );
      await verifyFact(created.id, "system");
      factCount++;
    }
  }

  console.log(`Done. ${categoryRecords.length} categories, ${factCount} facts.`);

  console.log("Seeding this-day-in-history entries...");
  // Idempotent like the fact seeding above: wipe and re-insert rather than
  // accumulate duplicates across repeated `npm run seed` runs. No revision
  // log for this table (not in spec 3.5's scope), so no mutation-layer
  // helper exists for it — self-check against the same gate instead.
  await prisma.thisDayInHistory.deleteMany({});
  const historySeeds = buildHistorySeeds();
  for (const seed of historySeeds) {
    const wordCount = countWords(seed.text);

    // this_day_in_history has no verification_note column (spec 3.4's field
    // list omits it) — PLACEHOLDER_NOTE here only satisfies the check
    // function's interface, it isn't persisted. That's fine: these seeds
    // stay under the 50-word/2-source thresholds that would actually
    // require a note.
    const check = canReachVerified({
      sources: PLACEHOLDER_SOURCES,
      verificationNote: PLACEHOLDER_NOTE,
      wordCount,
      timeSensitive: false,
      reverificationCadence: null,
      reverificationDueDate: null,
    });
    if (!check.ok) {
      throw new Error(`History seed for ${seed.monthDay} fails verification: ${check.reasons.join("; ")}`);
    }

    await prisma.thisDayInHistory.create({
      data: {
        monthDay: seed.monthDay,
        text: seed.text,
        wordCount,
        sources: PLACEHOLDER_SOURCES as unknown as object,
        verificationStatus: "verified",
        shareSlug: generateShareSlug(),
      },
    });
  }
  console.log(`Done. ${historySeeds.length} this-day-in-history entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
