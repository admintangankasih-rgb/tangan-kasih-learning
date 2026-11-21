import { describe, expect, it } from "vitest";
import { averageScore, isInactive, needsSupport } from "./student-stats";

const now = new Date("2026-11-02T00:00:00Z").getTime();
const base = { now, supportThreshold: 60, inactiveDays: 14, lastActive: null as string | null };

describe("student stats", () => {
  it("averages scores", () => expect(averageScore([50, 70, 90])).toBe(70));
  it("flags support when average below threshold", () => expect(needsSupport({ ...base, scores: [50, 65] })).toBe(true));
  it("does not flag support at threshold", () => expect(needsSupport({ ...base, scores: [60] })).toBe(false));
  it("does not flag support without scores", () => expect(needsSupport({ ...base, scores: [] })).toBe(false));
  it("inactive after 15 days", () => expect(isInactive({ ...base, scores: [], lastActive: "2026-10-18T00:00:00Z" })).toBe(true));
  it("active within 13 days", () => expect(isInactive({ ...base, scores: [], lastActive: "2026-10-20T00:00:00Z" })).toBe(false));
});
