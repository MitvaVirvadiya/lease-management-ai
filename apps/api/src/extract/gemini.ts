import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { FIELD_CATALOG } from "../fields/catalog";
import type { ExtractedField } from "./types";
import { extractWithRules } from "./rules";

const fieldProperties: Record<string, Schema> = {};
for (const def of FIELD_CATALOG) {
  fieldProperties[def.key] = {
    type: SchemaType.OBJECT,
    properties: {
      value: { type: SchemaType.STRING, nullable: true },
      confidence: { type: SchemaType.NUMBER },
      sourcePage: { type: SchemaType.INTEGER },
      sourcePhrase: { type: SchemaType.STRING, nullable: true },
    },
    required: ["value", "confidence", "sourcePage"],
  };
}

const RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    fields: {
      type: SchemaType.OBJECT,
      properties: fieldProperties,
    },
  },
  required: ["fields"],
};

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function extractWithGemini(
  rawText: string,
  pdf?: { buffer: Buffer; mimeType: string },
  slug?: string,
): Promise<{ fields: ExtractedField[]; rawText: string } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.1,
    },
  });

  const catalog = FIELD_CATALOG.map((f) => `${f.key} (${f.valueType}): ${f.label}`).join("\n");
  const prompt = `You extract commercial retail lease fields for in-house counsel.
Return only the JSON schema. Money as integer rupees (no commas, no ₹). Dates as YYYY-MM-DD. Booleans as "true" or "false". Percents as numbers without %.
If unknown, value is null and confidence is 0.
Never invent rent, deposits, or dates that are not in the instrument.

Field catalog:
${catalog}

Instrument text (may be incomplete if a PDF is also attached):
${rawText.slice(0, 24000)}`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];
  if (pdf) {
    parts.push({
      inlineData: { mimeType: pdf.mimeType, data: pdf.buffer.toString("base64") },
    });
  }

  try {
    const result = await model.generateContent(parts);
    const text = result.response.text();
    const parsed = JSON.parse(text) as {
      fields?: Record<
        string,
        { value?: string | null; confidence?: number; sourcePage?: number; sourcePhrase?: string }
      >;
    };
    const incoming = parsed.fields ?? {};
    const fields: ExtractedField[] = FIELD_CATALOG.map((def) => {
      const hit = incoming[def.key];
      return {
        key: def.key,
        label: def.label,
        category: def.category,
        value: hit?.value != null && hit.value !== "" ? String(hit.value) : null,
        valueType: def.valueType,
        confidence: Math.max(0, Math.min(1, Number(hit?.confidence ?? 0))),
        sourcePage: hit?.sourcePage || def.page,
        sourcePhrase: hit?.sourcePhrase ?? null,
        required: def.required,
      };
    });
    return { fields, rawText };
  } catch (err) {
    console.warn("Gemini extract failed, using rules:", err);
    return {
      fields: extractWithRules(rawText, { slug }),
      rawText,
    };
  }
}
