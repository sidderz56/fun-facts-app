// Visual design tokens for the Fun Facts UI (design handoff, high-fidelity).
// Presentation-only — the DB's category rows don't carry hue/icon-shape, so
// this file is the single source of truth mapping a category slug to its
// tile hue and icon shape. Deliberately not stored in Postgres: this is a
// pure styling pass, not a change to the product's state model.

export type CategoryShape =
  | "column"
  | "atom"
  | "paw"
  | "globe"
  | "bodymind"
  | "speech"
  | "dining"
  | "singer"
  | "note";

type CategoryDesign = { hue: number; shape: CategoryShape };

export const CATEGORY_DESIGN: Record<string, CategoryDesign> = {
  history: { hue: 30, shape: "column" },
  science: { hue: 165, shape: "atom" },
  "animals-nature": { hue: 120, shape: "paw" },
  geography: { hue: 205, shape: "globe" },
  "human-body-mind": { hue: 280, shape: "bodymind" },
  "words-language": { hue: 20, shape: "speech" },
  "food-drink": { hue: 55, shape: "dining" },
  "pop-culture-entertainment": { hue: 340, shape: "singer" },
  "money-business": { hue: 90, shape: "note" },
};

export function categoryTileBg(hue: number): string {
  return `oklch(93% 0.045 ${hue})`;
}
