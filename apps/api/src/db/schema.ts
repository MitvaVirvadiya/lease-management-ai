import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const pipelineStages = pgTable("pipeline_stages", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull(),
  brief: text("brief").notNull(),
});

export const leases = pgTable("leases", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  fileName: text("file_name"),
  sourceType: text("source_type").notNull().default("digital"),
  extractMode: text("extract_mode").notNull().default("rules"),
  stage: text("stage")
    .notNull()
    .references(() => pipelineStages.slug),
  committed: boolean("committed").notNull().default(false),
  committedAt: timestamp("committed_at", { withTimezone: true }),
  brand: text("brand").notNull(),
  mall: text("mall").notNull(),
  unit: text("unit").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  rawText: text("raw_text").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leaseFields = pgTable(
  "lease_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leaseId: uuid("lease_id")
      .notNull()
      .references(() => leases.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    category: text("category").notNull(),
    value: text("value"),
    valueType: text("value_type").notNull(),
    confidence: doublePrecision("confidence").notNull().default(0),
    sourcePage: integer("source_page").notNull().default(1),
    sourcePhrase: text("source_phrase"),
    required: boolean("required").notNull().default(false),
    edited: boolean("edited").notNull().default(false),
  },
  (t) => [unique("lease_fields_lease_key").on(t.leaseId, t.key)],
);

export const outlets = pgTable("outlets", {
  id: uuid("id").primaryKey().defaultRandom(),
  leaseId: uuid("lease_id")
    .notNull()
    .references(() => leases.id, { onDelete: "cascade" })
    .unique(),
  code: text("code").notNull().unique(),
  brand: text("brand").notNull(),
  mall: text("mall").notNull(),
  unit: text("unit").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  areaSqft: integer("area_sqft").notNull(),
  status: text("status").notNull().default("trading"),
  openedAt: date("opened_at"),
});

export const obligations = pgTable("obligations", {
  id: uuid("id").primaryKey().defaultRandom(),
  leaseId: uuid("lease_id")
    .notNull()
    .references(() => leases.id, { onDelete: "cascade" }),
  outletId: uuid("outlet_id").references(() => outlets.id, {
    onDelete: "cascade",
  }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: date("due_date"),
  status: text("status").notNull().default("open"),
});

export const paymentSchedules = pgTable("payment_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  leaseId: uuid("lease_id")
    .notNull()
    .references(() => leases.id, { onDelete: "cascade" }),
  outletId: uuid("outlet_id").references(() => outlets.id, {
    onDelete: "cascade",
  }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  dueDate: date("due_date").notNull(),
  rentAmount: integer("rent_amount").notNull(),
  camAmount: integer("cam_amount").notNull(),
  otherAmount: integer("other_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  leaseId: uuid("lease_id")
    .notNull()
    .references(() => leases.id, { onDelete: "cascade" }),
  outletId: uuid("outlet_id").references(() => outlets.id, {
    onDelete: "cascade",
  }),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull().default("open"),
});

export const chatThreads = pgTable("chat_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default("Portfolio counsel"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => chatThreads.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  citations: jsonb("citations").$type<string[]>().default([]),
  toolCalls: jsonb("tool_calls"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Lease = typeof leases.$inferSelect;
export type LeaseField = typeof leaseFields.$inferSelect;
export type Outlet = typeof outlets.$inferSelect;
export type Obligation = typeof obligations.$inferSelect;
export type PaymentSchedule = typeof paymentSchedules.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type ChatThread = typeof chatThreads.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
