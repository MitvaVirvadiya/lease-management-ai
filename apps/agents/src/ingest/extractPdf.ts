import { extractText, getDocumentProxy } from "unpdf";
import fs from "node:fs/promises";
import { getPdfStats, judgePdfQuality } from "./pdfQuality.js";

export const extractTextFromPdf = async (pdfBytes: Buffer) => {
  const pdf = await getDocumentProxy(new Uint8Array(pdfBytes));

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
