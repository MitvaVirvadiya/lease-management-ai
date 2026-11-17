import { PdfProcessingError } from "./pdfErrors.js";

// Minimum average characters per page for text extraction quality.
export const MIN_AVG_CHARACTERS_PER_PAGE = 36;

export const getPdfStats = (text: string[], totalPages: number) => {
  if (totalPages <= 0) {
    throw new PdfProcessingError("PDF contains no pages.", "EMPTY_PDF");
  }

  const totalCharacters = text.join("").replace(/\s/g, "").length;

  return { totalCharacters, avgCharacters: totalCharacters / totalPages };
};

export const judgePdfQuality = (totalCharacters: number, avgCharacters: number) => {
  // No extractable text usually indicates an image-based PDF.
  if (totalCharacters === 0) {
    throw new PdfProcessingError("No extractable text found. OCR is required.", "NO_EXTRACTABLE_TEXT");
  }

  // Some text exists, but its density is insufficient.
  if (avgCharacters < MIN_AVG_CHARACTERS_PER_PAGE) {
    throw new PdfProcessingError(`PDF text density is too low. Minimum required: ${MIN_AVG_CHARACTERS_PER_PAGE} characters per page.`, "LOW_TEXT_DENSITY");
  }
};
