import { Injectable } from "@nestjs/common";
import { extractWithGemini, geminiConfigured } from "./gemini";
import { extractWithRules } from "./rules";
import type { ExtractResult } from "./types";
import { coerceExtracted } from "./zod-schema";

@Injectable()
export class ExtractService {
  async extract(input: {
    rawText: string;
    slug?: string;
    pdf?: { buffer: Buffer; mimeType: string };
  }): Promise<ExtractResult> {
    if (geminiConfigured()) {
      const gem = await extractWithGemini(input.rawText, input.pdf, input.slug);
      if (gem) {
        return { fields: coerceExtracted(gem.fields), mode: "gemini", rawText: gem.rawText };
      }
    }
    return {
      fields: coerceExtracted(extractWithRules(input.rawText, { slug: input.slug })),
      mode: "rules",
      rawText: input.rawText,
    };
  }
}
