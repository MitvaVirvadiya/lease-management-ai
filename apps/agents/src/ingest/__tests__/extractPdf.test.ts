import { describe, it, expect } from "vitest";
import { resolve } from "node:path";

import { extractPdf, extractTextFromPdf } from "../extractPdf.js";

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

  it("should reject corrupted bytes as INVALID_PDF", async () => {
    await expect(extractTextFromPdf(Buffer.from("not a valid PDF"))).rejects.toMatchObject({ name: "PdfProcessingError", code: "INVALID_PDF" });
  });

  it("should reject password-protected PDFs as PASSWORD_PROTECTED", async () => {
    await expect(extractPdf(resolve(fixtures, "Password_Protected.pdf"))).rejects.toMatchObject({ name: "PdfProcessingError", code: "PASSWORD_PROTECTED" });
  });
});
