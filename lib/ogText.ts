// Open Graph text formatting (spec 4.4).

const OG_TITLE_MAX_CHARS = 60;
const OG_DESCRIPTION_MAX_CHARS = 200; // safe common denominator across platforms

function truncateAtWordBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
}

// og:title = "Fun Fact: [first ~60 characters]…"
export function ogTitle(factText: string): string {
  if (factText.length <= OG_TITLE_MAX_CHARS) {
    return `Fun Fact: ${factText}`;
  }
  return `Fun Fact: ${truncateAtWordBoundary(factText, OG_TITLE_MAX_CHARS)}…`;
}

// og:description = full fact text, truncated to platform limits
export function ogDescription(factText: string): string {
  if (factText.length <= OG_DESCRIPTION_MAX_CHARS) return factText;
  return `${truncateAtWordBoundary(factText, OG_DESCRIPTION_MAX_CHARS)}…`;
}
