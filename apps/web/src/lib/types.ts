export type StageSlug =
  | "intake"
  | "extract"
  | "review"
  | "active"
  | "escalation"
  | "exit";

export type LeaseListItem = {
  id: string;
  code: string;
  title: string;
  slug: string;
  brand: string;
  mall: string;
  unit: string;
  city: string;
  state: string | null;
  stage: StageSlug;
  committed: boolean;
  sourceType: string;
  extractMode: string;
  monthlyRent: number;
  expirationDate: string | null;
  alertCount: number;
  updatedAt: string;
};

export type LeaseField = {
  id: string;
  leaseId: string;
  key: string;
  label: string;
  category: string;
  value: string | null;
  valueType: string;
  confidence: number;
  sourcePage: number;
  sourcePhrase: string | null;
  required: boolean;
  edited: boolean;
};

export type Outlet = {
  id: string;
  code: string;
  brand: string;
  mall: string;
  unit: string;
  address: string;
  city: string;
  areaSqft: number;
  status: string;
};

export type ScheduleRow = {
  id: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  rentAmount: number;
  camAmount: number;
  otherAmount: number;
  totalAmount: number;
  status: string;
  notes: string | null;
};

export type AlertItem = {
  id: string;
  leaseId: string;
  type: string;
  severity: string;
  title: string;
  body: string;
  dueDate: string;
  status: string;
  leaseCode?: string;
  brand?: string;
  mall?: string;
  unit?: string;
};

export type Obligation = {
  id: string;
  type: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: string;
};

export type LeaseDetail = {
  id: string;
  code: string;
  title: string;
  slug: string;
  brand: string;
  mall: string;
  unit: string;
  city: string;
  state: string | null;
  stage: StageSlug;
  committed: boolean;
  committedAt: string | null;
  sourceType: string;
  extractMode: string;
  fileName: string | null;
  rawText: string;
  pages: string[];
  fields: LeaseField[];
  outlet: Outlet | null;
  obligations: Obligation[];
  schedule: ScheduleRow[];
  alerts: AlertItem[];
};

export type Dashboard = {
  asOf: string;
  matterCount: number;
  sealedCount: number;
  monthlyRent: number;
  annualRent: number;
  openAlertCount: number;
  criticalAlertCount: number;
  byStage: { slug: string; name: string; count: number }[];
  causeList: {
    id: string;
    leaseId: string;
    type: string;
    severity: string;
    title: string;
    dueDate: string;
  }[];
  awaitingSeal: LeaseListItem[];
};

export type PipelineColumn = {
  slug: StageSlug;
  name: string;
  sortOrder: number;
  brief: string;
  leases: LeaseListItem[];
};

export type SampleItem = {
  slug: string;
  code: string;
  title: string;
  brand: string;
  mall: string;
  unit: string;
  city: string;
  sourceType: string;
  highlight: string | null;
};

export type ChatMessage = {
  id: string;
  role: string;
  content: string;
  citations: string[] | null;
  toolCalls: unknown;
  createdAt: string;
};

export type ChatThread = {
  id: string;
  title: string;
  createdAt: string;
  messages?: ChatMessage[];
};

export const CATEGORY_LABEL: Record<string, string> = {
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

export const CATEGORY_ORDER = [
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
