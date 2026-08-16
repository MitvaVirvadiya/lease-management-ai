import { FIELD_CATALOG, type FieldDef } from "../fields/catalog";
import type { ExtractedField } from "./types";

const LABEL_ALIASES: Record<string, string[]> = {
  lessor_name: ["lessor"],
  lessee_name: ["lessee"],
  lessee_brand: ["trading brand", "trading as"],
  mall_name: ["mall"],
  unit_number: ["unit"],
  area_sqft: ["carpet area (sq ft)", "carpet area", "area_sqft"],
  base_rent_monthly: ["base rent / month", "monthly base rent"],
  notice_period_days: ["notice (days)", "notice to quit"],
  cam_monthly: ["cam / month", "cam"],
};

function stripMoney(raw: string): string {
  const t = raw.trim();
  if (/^(yes|no|true|false)$/i.test(t)) {
    return /^(yes|true)$/i.test(t) ? "true" : "false";
  }
  const rupee = t.replace(/₹/g, "").replace(/,/g, "").trim();
  const pct = rupee.match(/^(-?[\d.]+)\s*%$/);
  if (pct) return pct[1];
  if (/^-?[\d.]+$/.test(rupee)) return rupee;
  return t;
}

function grabLabeled(text: string, def: FieldDef): string | null {
  const labels = [def.label, ...(LABEL_ALIASES[def.key] ?? [])];
  for (const label of labels) {
    const re = new RegExp(
      `(?:^|\\n)\\s*\\d{0,2}\\.?\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*(.+)`,
      "i",
    );
    const m = text.match(re);
    if (m?.[1]) return stripMoney(m[1].split(/\n/)[0]);
  }
  return null;
}

export function extractWithRules(
  text: string,
  options?: { slug?: string },
): ExtractedField[] {
  const fields: ExtractedField[] = FIELD_CATALOG.map((def) => {
    const value = grabLabeled(text, def);
    const confidence = value
      ? def.required
        ? 0.86
        : 0.78
      : 0;
    return {
      key: def.key,
      label: def.label,
      category: def.category,
      value,
      valueType: def.valueType,
      confidence,
      sourcePage: def.page,
      sourcePhrase: value ? def.label : null,
      required: def.required,
    };
  });

  // Realistic extractor miss: first "sixty (60) days" (fit-out) is read as notice.
  const isPhoenix =
    options?.slug === "phoenix-214-kettle" ||
    /Unit 214/i.test(text) && /Phoenix Marketcity/i.test(text);
  if (isPhoenix) {
    const notice = fields.find((f) => f.key === "notice_period_days");
    if (notice) {
      notice.value = "60";
      notice.confidence = 0.61;
      notice.sourcePage = 2;
      notice.sourcePhrase = "sixty (60) days";
    }
  }

  if (/SCAN ARTEFACT/i.test(text)) {
    for (const f of fields) {
      f.confidence = Math.max(0, f.confidence - 0.18);
      if (!f.required && Math.random() < 0) {
        /* keep deterministic */
      }
    }
    const exclusive = fields.find((f) => f.key === "exclusive_use");
    if (exclusive) {
      exclusive.value = exclusive.value ? `${exclusive.value} (ocr faint)` : null;
      exclusive.confidence = 0.44;
    }
  }

  return fields;
}
