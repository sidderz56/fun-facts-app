// Dev seed script (spec 2.1, plan Phase 0 deliverables).
// Inserts the 9 categories with their target proportions, plus 5 obviously-
// placeholder facts each (45 total), spanning the short/medium/long word-count
// bands so fact-view typography can be evaluated honestly.
//
// Do NOT put real fun facts here — real content comes from the editorial
// pipeline in spec 2.3/2.4, which is out of scope for this build.
//
// Run with: npm run seed

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { countWords, factLengthClass } from "../lib/textMetrics";
import { generateShareSlug } from "../lib/shareSlug";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

async function main() {
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
    // Wipe this category's placeholder facts first so re-running the script
    // is idempotent instead of piling up duplicates.
    await prisma.fact.deleteMany({ where: { categoryId: category.id } });

    for (let i = 0; i < BODY_WORD_TARGETS.length; i++) {
      const text = placeholderText(category.name, i + 1, BODY_WORD_TARGETS[i]);
      const wordCount = countWords(text);
      await prisma.fact.create({
        data: {
          text,
          categoryId: category.id,
          wordCount,
          factLengthClass: factLengthClass(wordCount),
          shareSlug: generateShareSlug(),
          // verificationStatus defaults to `verified` — the Phase 0 shortcut
          // called out in schema.prisma with a TODO(phase4).
        },
      });
      factCount++;
    }
  }

  console.log(`Done. ${categoryRecords.length} categories, ${factCount} facts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
