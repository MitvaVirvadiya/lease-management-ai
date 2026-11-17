import { extractText, getDocumentProxy } from "unpdf";
import fs from "node:fs/promises";
import { getPdfStats, judgePdfQuality } from "./pdfQuality.js";
import { PdfProcessingError } from "./pdfErrors.js";

export const extractTextFromPdf = async (pdfBytes: Buffer) => {
  let pdf;
  try {
    pdf = await getDocumentProxy(new Uint8Array(pdfBytes));
  } catch (error) {
    if (error instanceof Error && error.name === "InvalidPDFException") {
      throw new PdfProcessingError("The file is not a valid or readable PDF.", "INVALID_PDF");
    }
    if (error instanceof Error && error.name === "PasswordException") {
      throw new PdfProcessingError("The PDF is password-protected.", "PASSWORD_PROTECTED");
    }
    throw error;
  }

  const { totalPages, text } = await extractText(pdf);

  return { totalPages, text };
};

export const extractPdf = async (pdfFile: string) => {
  const pdfBytes = await fs.readFile(pdfFile);

  const { totalPages, text } = await extractTextFromPdf(pdfBytes);

  const stats = getPdfStats(text, totalPages);

  judgePdfQuality(stats.totalCharacters, stats.avgCharacters);

  return { totalPages, text, ...stats };
};
