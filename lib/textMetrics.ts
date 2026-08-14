// Fact length rules from spec 2.9. Validation against these bands (rejecting
// >75 words, requiring verification_note for 51-75) lands in Phase 4 — this
// module only computes the numbers, it doesn't enforce anything yet.

export type FactLengthClass = "short" | "medium" | "long";

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// short 15-25 / medium 26-40 / long 41+ (spec 2.9)
export function factLengthClass(wordCount: number): FactLengthClass {
  if (wordCount <= 25) return "short";
  if (wordCount <= 40) return "medium";
  return "long";
}
