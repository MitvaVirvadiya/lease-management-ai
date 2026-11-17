import { describe, it, expect } from "vitest";
import { resolve } from "node:path";

import { extractPdf } from "../extractPdf.js";
import { PdfProcessingError } from "../pdfErrors.js";

const fixtures = resolve(process.cwd(), "docs");

describe("PDF ingestion pipeline", () => {
  it("should extract a valid lease agreement", async () => {
    const result = await extractPdf(resolve(fixtures, "Lease_Agreement_Dummy.pdf"));

    expect(result.totalPages).toBeGreaterThan(0);
    expect(result.totalCharacters).toBeGreaterThan(0);
    expect(result.avgCharacters).toBeGreaterThanOrEqual(35);
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("should reject footer-only PDFs", async () => {
    await expect(extractPdf(resolve(fixtures, "Footer_Only.pdf"))).rejects.toMatchObject({ code: "LOW_TEXT_DENSITY" });
  });

  it("should identify scanned PDFs requiring OCR", async () => {
    await expect(extractPdf(resolve(fixtures, "Scanned_Lease.pdf"))).rejects.toMatchObject({ code: "NO_EXTRACTABLE_TEXT" });
  });

  it("should preserve unexpected extraction errors", async () => {
    const invalidPdf = Buffer.from("not a valid PDF");

    await expect(import("../extractPdf.js").then(({ extractTextFromPdf }) => extractTextFromPdf(invalidPdf))).rejects.not.toBeInstanceOf(PdfProcessingError);
  });
});
