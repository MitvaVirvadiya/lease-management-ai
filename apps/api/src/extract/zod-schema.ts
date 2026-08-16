import { z } from "zod";
import { FIELD_CATALOG } from "../fields/catalog";
import type { ExtractedField } from "./types";

const extractedField = z.object({
  key: z.string(),
  label: z.string(),
  category: z.string(),
  value: z.string().nullable(),
  valueType: z.string(),
  confidence: z.number().min(0).max(1),
  sourcePage: z.number().int().positive(),
  sourcePhrase: z.string().nullable(),
  required: z.boolean(),
});

export const ExtractedFieldsSchema = z.array(extractedField);

export function coerceExtracted(fields: ExtractedField[]): ExtractedField[] {
  const parsed = ExtractedFieldsSchema.safeParse(fields);
  if (!parsed.success) {
    return FIELD_CATALOG.map((def) => ({
      key: def.key,
      label: def.label,
      category: def.category,
      value: null,
      valueType: def.valueType,
      confidence: 0,
      sourcePage: def.page,
      sourcePhrase: null,
      required: def.required,
    }));
  }
  return parsed.data as ExtractedField[];
}
