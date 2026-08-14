import { randomBytes } from "crypto";

// URL-safe, non-sequential (spec/plan Phase 2: "don't leak corpus size").
// Lowercase letters + digits only, no ambiguity handling needed since these
// are never hand-typed by a user, only clicked or pasted.
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateShareSlug(length = 10): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
