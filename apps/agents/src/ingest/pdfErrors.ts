export type PdfErrorCode = "EMPTY_PDF" | "NO_EXTRACTABLE_TEXT" | "LOW_TEXT_DENSITY";

export class PdfProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: PdfErrorCode,
  ) {
    super(message);
    this.name = "PdfProcessingError";
  }
}
