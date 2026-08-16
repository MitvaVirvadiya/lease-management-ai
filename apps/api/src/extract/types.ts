import type { FieldCategory, FieldType } from "../fields/catalog";

export type ExtractedField = {
  key: string;
  label: string;
  category: FieldCategory;
  value: string | null;
  valueType: FieldType;
  confidence: number;
  sourcePage: number;
  sourcePhrase: string | null;
  required: boolean;
};

export type ExtractResult = {
  fields: ExtractedField[];
  mode: "gemini" | "rules";
  rawText: string;
};
