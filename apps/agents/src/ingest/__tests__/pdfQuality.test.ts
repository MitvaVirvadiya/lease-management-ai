import { describe, it, expect } from "vitest";
import { getPdfStats, judgePdfQuality, MIN_AVG_CHARACTERS_PER_PAGE } from "../pdfQuality.js";

describe("PDF quality validation", () => {
  it("should calculate average characters per page", () => {
    const stats = getPdfStats(["A".repeat(100), "B".repeat(100)], 2);

    expect(stats.avgCharacters).toBe(100);
  });

  it("should reject zero extractable characters", () => {
    const stats = getPdfStats(["", ""], 2);

    expect(() => judgePdfQuality(stats.totalCharacters, stats.avgCharacters)).toThrowError("No extractable text found. OCR is required.");
  });

  it("should reject text below minimum threshold", () => {
    const stats = getPdfStats(["A".repeat(70)], 2);

    expect(() => judgePdfQuality(stats.totalCharacters, stats.avgCharacters)).toThrow();
  });

  it("should accept text at the minimum threshold", () => {
    expect(() => judgePdfQuality(MIN_AVG_CHARACTERS_PER_PAGE, MIN_AVG_CHARACTERS_PER_PAGE)).not.toThrow();
  });
});
