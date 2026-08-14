import { describe, it, expect } from "vitest";
import { ogTitle, ogDescription } from "./ogText";

describe("ogTitle", () => {
  it("prefixes short text with 'Fun Fact: ' and no ellipsis", () => {
    expect(ogTitle("Short fact.")).toBe("Fun Fact: Short fact.");
  });

  it("truncates long text to ~60 chars at a word boundary with an ellipsis", () => {
    const long = "A".repeat(30) + " " + "B".repeat(40);
    const result = ogTitle(long);
    expect(result.startsWith("Fun Fact: ")).toBe(true);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toContain("B".repeat(40)); // full tail must be cut
  });

  it("never cuts mid-word", () => {
    const text = "word ".repeat(20).trim();
    const result = ogTitle(text);
    const body = result.replace("Fun Fact: ", "").replace("…", "");
    expect(body.endsWith(" ")).toBe(false);
    expect(text.startsWith(body)).toBe(true);
  });
});

describe("ogDescription", () => {
  it("returns short text unchanged", () => {
    expect(ogDescription("Short fact.")).toBe("Short fact.");
  });

  it("truncates text over the platform limit with an ellipsis", () => {
    const long = "word ".repeat(100).trim();
    const result = ogDescription(long);
    expect(result.length).toBeLessThan(long.length);
    expect(result.endsWith("…")).toBe(true);
  });
});
