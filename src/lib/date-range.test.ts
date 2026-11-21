import { describe, it, expect } from "vitest";
import { inDateRange } from "./format";
describe("inDateRange (Asia/Jakarta)", () => {
  it("counts a 20:00 UTC attempt as the next Jakarta day", () => {
    expect(inDateRange("2026-11-02T20:00:00Z", "2026-11-03", "2026-11-03")).toBe(true);
    expect(inDateRange("2026-11-02T20:00:00Z", "2026-11-02", "2026-11-02")).toBe(false);
  });
  it("is open when no bounds are set", () => { expect(inDateRange(null, "", "")).toBe(true); });
  it("excludes rows without a date when a bound is set", () => { expect(inDateRange(null, "2026-01-01", "")).toBe(false); });
});
