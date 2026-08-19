import { describe, it, expect } from "vitest";
import { resolveSource } from "./eventCapture";

// resolveSource is the one piece of real judgment in event capture (spec
// 5.8) — everything else in lib/eventCapture.ts is a straight DB write of
// caller-supplied values, so it's the only thing worth unit-testing without
// a live database (same split as lib/selectionCore.ts, lib/reportingCore.ts).
describe("resolveSource (spec 5.8 fact_viewed source attribution)", () => {
  it("recognizes each of the four internal source values", () => {
    expect(resolveSource("tile")).toBe("tile");
    expect(resolveSource("another")).toBe("another");
    expect(resolveSource("random")).toBe("random");
    expect(resolveSource("share_page")).toBe("share_page");
  });

  it("defaults to share_page when no src param is present (external/shared-link arrival)", () => {
    expect(resolveSource(undefined)).toBe("share_page");
  });

  it("defaults to share_page for an unrecognized value rather than trusting it blindly", () => {
    expect(resolveSource("something-unexpected")).toBe("share_page");
  });

  it("defaults to share_page for an empty string", () => {
    expect(resolveSource("")).toBe("share_page");
  });
});
