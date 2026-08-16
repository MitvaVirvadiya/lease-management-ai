export type FieldType =
  | "text"
  | "money"
  | "date"
  | "number"
  | "boolean"
  | "percent";

export type FieldCategory =
  | "parties"
  | "premises"
  | "term"
  | "rent"
  | "deposits"
  | "cam"
  | "options"
  | "compliance"
  | "banking";

export type FieldDef = {
  key: string;
  label: string;
  category: FieldCategory;
  valueType: FieldType;
  required: boolean;
  page: number;
};

export const FIELD_CATALOG: FieldDef[] = [
  { key: "lessor_name", label: "Lessor", category: "parties", valueType: "text", required: true, page: 1 },
  { key: "lessor_cin", label: "Lessor CIN", category: "parties", valueType: "text", required: false, page: 1 },
  { key: "lessee_name", label: "Lessee", category: "parties", valueType: "text", required: true, page: 1 },
  { key: "lessee_brand", label: "Trading brand", category: "parties", valueType: "text", required: true, page: 1 },
  { key: "lessee_cin", label: "Lessee CIN", category: "parties", valueType: "text", required: false, page: 1 },
  { key: "guarantor", label: "Guarantor", category: "parties", valueType: "text", required: false, page: 1 },
  { key: "notice_address", label: "Notice address", category: "parties", valueType: "text", required: false, page: 3 },
  { key: "mall_name", label: "Mall", category: "premises", valueType: "text", required: true, page: 1 },
  { key: "unit_number", label: "Unit", category: "premises", valueType: "text", required: true, page: 1 },
  { key: "floor", label: "Floor", category: "premises", valueType: "text", required: true, page: 1 },
  { key: "address", label: "Premises address", category: "premises", valueType: "text", required: true, page: 1 },
  { key: "city", label: "City", category: "premises", valueType: "text", required: true, page: 1 },
  { key: "state", label: "State", category: "premises", valueType: "text", required: true, page: 1 },
  { key: "pincode", label: "PIN", category: "premises", valueType: "text", required: false, page: 1 },
  { key: "area_sqft", label: "Carpet area (sq ft)", category: "premises", valueType: "number", required: true, page: 1 },
  { key: "use_clause", label: "Permitted use", category: "premises", valueType: "text", required: true, page: 2 },
  { key: "commencement_date", label: "Commencement", category: "term", valueType: "date", required: true, page: 1 },
  { key: "possession_date", label: "Possession", category: "term", valueType: "date", required: false, page: 1 },
  { key: "rent_commencement_date", label: "Rent commencement", category: "term", valueType: "date", required: true, page: 1 },
  { key: "expiration_date", label: "Expiration", category: "term", valueType: "date", required: true, page: 1 },
  { key: "term_years", label: "Term (years)", category: "term", valueType: "number", required: true, page: 1 },
  { key: "lock_in_years", label: "Lock-in (years)", category: "term", valueType: "number", required: true, page: 2 },
  { key: "lock_in_end", label: "Lock-in ends", category: "term", valueType: "date", required: true, page: 2 },
  { key: "notice_period_days", label: "Notice (days)", category: "term", valueType: "number", required: true, page: 2 },
  { key: "base_rent_monthly", label: "Base rent / month", category: "rent", valueType: "money", required: true, page: 2 },
  { key: "base_rent_psf", label: "Base rent / sq ft", category: "rent", valueType: "money", required: false, page: 2 },
  { key: "rent_currency", label: "Currency", category: "rent", valueType: "text", required: true, page: 2 },
  { key: "escalation_percent", label: "Escalation %", category: "rent", valueType: "percent", required: true, page: 2 },
  { key: "escalation_frequency", label: "Escalation cadence", category: "rent", valueType: "text", required: true, page: 2 },
  { key: "next_escalation_date", label: "Next escalation", category: "rent", valueType: "date", required: true, page: 2 },
  { key: "free_rent_months", label: "Free rent (months)", category: "rent", valueType: "number", required: false, page: 2 },
  { key: "turnover_rent_percent", label: "Turnover rent %", category: "rent", valueType: "percent", required: false, page: 2 },
  { key: "security_deposit", label: "Security deposit", category: "deposits", valueType: "money", required: true, page: 2 },
  { key: "security_deposit_months", label: "Deposit (months of rent)", category: "deposits", valueType: "number", required: true, page: 2 },
  { key: "deposit_interest", label: "Deposit bears interest", category: "deposits", valueType: "boolean", required: true, page: 2 },
  { key: "fitout_deposit", label: "Fit-out deposit", category: "deposits", valueType: "money", required: false, page: 2 },
  { key: "cam_monthly", label: "CAM / month", category: "cam", valueType: "money", required: true, page: 2 },
  { key: "cam_psf", label: "CAM / sq ft", category: "cam", valueType: "money", required: false, page: 2 },
  { key: "hvac_monthly", label: "HVAC / month", category: "cam", valueType: "money", required: false, page: 2 },
  { key: "parking_monthly", label: "Parking / month", category: "cam", valueType: "money", required: false, page: 2 },
  { key: "marketing_fund_monthly", label: "Marketing fund / month", category: "cam", valueType: "money", required: false, page: 2 },
  { key: "renewal_option", label: "Renewal option", category: "options", valueType: "boolean", required: true, page: 3 },
  { key: "renewal_term_years", label: "Renewal term (years)", category: "options", valueType: "number", required: false, page: 3 },
  { key: "renewal_notice_days", label: "Renewal notice (days)", category: "options", valueType: "number", required: false, page: 3 },
  { key: "expansion_option", label: "Expansion / ROFR", category: "options", valueType: "boolean", required: false, page: 3 },
  { key: "termination_option", label: "Early termination", category: "options", valueType: "boolean", required: false, page: 3 },
  { key: "radius_restriction_km", label: "Radius restriction (km)", category: "options", valueType: "number", required: true, page: 3 },
  { key: "exclusive_use", label: "Exclusive use", category: "options", valueType: "text", required: false, page: 3 },
  { key: "insurance_amount", label: "Insurance cover", category: "compliance", valueType: "money", required: true, page: 3 },
  { key: "fitout_period_days", label: "Fit-out period (days)", category: "compliance", valueType: "number", required: false, page: 2 },
  { key: "signage_rights", label: "Signage", category: "compliance", valueType: "text", required: false, page: 3 },
  { key: "assignment_consent", label: "Assignment", category: "compliance", valueType: "text", required: false, page: 3 },
  { key: "gst_applicable", label: "GST on rent", category: "compliance", valueType: "boolean", required: true, page: 2 },
  { key: "payment_day", label: "Payment day of month", category: "banking", valueType: "number", required: true, page: 2 },
  { key: "payment_mode", label: "Payment mode", category: "banking", valueType: "text", required: true, page: 2 },
  { key: "late_fee_percent", label: "Late fee % / month", category: "banking", valueType: "percent", required: false, page: 2 },
  { key: "billing_cycle", label: "Billing cycle", category: "banking", valueType: "text", required: false, page: 2 },
];

export const CATEGORY_ORDER: FieldCategory[] = [
  "parties",
  "premises",
  "term",
  "rent",
  "deposits",
  "cam",
  "options",
  "compliance",
  "banking",
];

export const CATEGORY_LABEL: Record<FieldCategory, string> = {
  parties: "Parties",
  premises: "Premises",
  term: "Term",
  rent: "Rent",
  deposits: "Deposits",
  cam: "CAM & charges",
  options: "Options",
  compliance: "Compliance",
  banking: "Banking",
};

export const STAGES = [
  { slug: "intake", name: "Intake", sortOrder: 1, brief: "Instrument received, not yet read" },
  { slug: "extract", name: "Extract", sortOrder: 2, brief: "Fields pulled, awaiting counsel" },
  { slug: "review", name: "Review", sortOrder: 3, brief: "Human seal before commit" },
  { slug: "active", name: "Active", sortOrder: 4, brief: "Trading under the demise" },
  { slug: "escalation", name: "Escalation", sortOrder: 5, brief: "Rent step or dispute open" },
  { slug: "exit", name: "Exit", sortOrder: 6, brief: "Notice given or term ending" },
] as const;

export type StageSlug = (typeof STAGES)[number]["slug"];
