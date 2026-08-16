import { eq } from "drizzle-orm";
import { addDays, daysBetween, inr, parseBool, parseMoney, todayISO } from "../common/format";
import { db } from "../db/client";
import { leaseFields, leases } from "../db/schema";

export type ToolName = "expiring_in" | "escalations_due" | "deposit_at_risk" | "rent_roll" | "find_outlet";

export type ToolHit = {
  leaseId: string;
  code: string;
  brand: string;
  mall: string;
  unit: string;
  city: string;
  stage: string;
  facts: Record<string, string | number | boolean | null>;
};

async function committedLeases() {
  return db.select().from(leases).where(eq(leases.committed, true));
}

async function fieldMapFor(leaseId: string) {
  const rows = await db.select().from(leaseFields).where(eq(leaseFields.leaseId, leaseId));
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (r.value != null) map[r.key] = r.value;
  }
  return map;
}

export async function expiring_in(days: number): Promise<ToolHit[]> {
  const until = addDays(todayISO(), days);
  const rows = await committedLeases();
  const hits: ToolHit[] = [];
  for (const l of rows) {
    const f = await fieldMapFor(l.id);
    const exp = f.expiration_date;
    if (!exp) continue;
    if (exp <= until) {
      hits.push({
        leaseId: l.id,
        code: l.code,
        brand: l.brand,
        mall: l.mall,
        unit: l.unit,
        city: l.city,
        stage: l.stage,
        facts: {
          expiration_date: exp,
          days_remaining: daysBetween(todayISO(), exp),
          monthly_rent: parseMoney(f.base_rent_monthly),
          monthly_rent_display: inr(parseMoney(f.base_rent_monthly)),
        },
      });
    }
  }
  hits.sort((a, b) => Number(a.facts.days_remaining) - Number(b.facts.days_remaining));
  return hits;
}

export async function escalations_due(days: number): Promise<ToolHit[]> {
  const until = addDays(todayISO(), days);
  const rows = await committedLeases();
  const hits: ToolHit[] = [];
  for (const l of rows) {
    const f = await fieldMapFor(l.id);
    const next = f.next_escalation_date;
    if (!next) continue;
    if (next <= until) {
      const current = parseMoney(f.base_rent_monthly);
      const pct = Number(f.escalation_percent || 0);
      const nextRent = Math.round(current * (1 + pct / 100));
      hits.push({
        leaseId: l.id,
        code: l.code,
        brand: l.brand,
        mall: l.mall,
        unit: l.unit,
        city: l.city,
        stage: l.stage,
        facts: {
          next_escalation_date: next,
          days_until: daysBetween(todayISO(), next),
          escalation_percent: pct,
          current_rent: current,
          current_rent_display: inr(current),
          next_rent: nextRent,
          next_rent_display: inr(nextRent),
        },
      });
    }
  }
  hits.sort((a, b) => Number(a.facts.days_until) - Number(b.facts.days_until));
  return hits;
}

export async function deposit_at_risk(): Promise<ToolHit[]> {
  const rows = await committedLeases();
  const hits: ToolHit[] = [];
  for (const l of rows) {
    const f = await fieldMapFor(l.id);
    const months = Number(f.security_deposit_months || 0);
    const interest = parseBool(f.deposit_interest);
    if (months > 0 && (months < 6 || !interest)) {
      hits.push({
        leaseId: l.id,
        code: l.code,
        brand: l.brand,
        mall: l.mall,
        unit: l.unit,
        city: l.city,
        stage: l.stage,
        facts: {
          security_deposit: parseMoney(f.security_deposit),
          security_deposit_display: inr(parseMoney(f.security_deposit)),
          security_deposit_months: months,
          deposit_interest: interest,
          reason:
            months < 6
              ? `${months} months’ cover (policy is 6)`
              : "Deposit does not bear interest; lessor may draw on 7 days’ notice",
        },
      });
    }
  }
  return hits;
}

export async function rent_roll(): Promise<{
  monthly: number;
  annual: number;
  monthly_display: string;
  annual_display: string;
  outlets: ToolHit[];
}> {
  const rows = await committedLeases();
  const outlets: ToolHit[] = [];
  let monthly = 0;
  for (const l of rows) {
    if (l.stage === "intake" || l.stage === "extract" || l.stage === "review") continue;
    const f = await fieldMapFor(l.id);
    const rent = parseMoney(f.base_rent_monthly);
    monthly += rent;
    outlets.push({
      leaseId: l.id,
      code: l.code,
      brand: l.brand,
      mall: l.mall,
      unit: l.unit,
      city: l.city,
      stage: l.stage,
      facts: {
        monthly_rent: rent,
        monthly_rent_display: inr(rent),
      },
    });
  }
  return {
    monthly,
    annual: monthly * 12,
    monthly_display: inr(monthly),
    annual_display: inr(monthly * 12),
    outlets,
  };
}

export async function find_outlet(query: string): Promise<ToolHit[]> {
  const q = query.toLowerCase();
  const rows = await db.select().from(leases);
  const hits: ToolHit[] = [];
  for (const l of rows) {
    const blob = `${l.code} ${l.brand} ${l.mall} ${l.unit} ${l.city} ${l.title}`.toLowerCase();
    if (!blob.includes(q)) continue;
    const f = await fieldMapFor(l.id);
    hits.push({
      leaseId: l.id,
      code: l.code,
      brand: l.brand,
      mall: l.mall,
      unit: l.unit,
      city: l.city,
      stage: l.stage,
      facts: {
        monthly_rent: parseMoney(f.base_rent_monthly),
        monthly_rent_display: inr(parseMoney(f.base_rent_monthly)),
        expiration_date: f.expiration_date ?? null,
        committed: l.committed,
      },
    });
  }
  return hits;
}

export const TOOL_IMPL = {
  expiring_in,
  escalations_due,
  deposit_at_risk,
  rent_roll,
  find_outlet,
};

export function classifyIntent(message: string): { tool: ToolName; args: Record<string, unknown> }[] {
  const m = message.toLowerCase();
  const daysMatch = m.match(/(\d+)\s*day/);
  const days = daysMatch ? Number(daysMatch[1]) : 90;
  const calls: { tool: ToolName; args: Record<string, unknown> }[] = [];

  if (/escalat/.test(m) || /step(?:s|ping)? rent/.test(m)) {
    calls.push({ tool: "escalations_due", args: { days } });
  }
  if (/expir|term end|ending|notice window|renew/.test(m) && !/escalat/.test(m)) {
    calls.push({ tool: "expiring_in", args: { days } });
  }
  if (/deposit|at risk|security/.test(m)) {
    calls.push({ tool: "deposit_at_risk", args: {} });
  }
  if (/rent roll|arr|how much rent|portfolio rent/.test(m)) {
    calls.push({ tool: "rent_roll", args: {} });
  }
  const unit = m.match(/unit\s+([a-z0-9-]+)/i);
  const phoenix = /phoenix/.test(m);
  if (unit || phoenix || /palladium|citywalk|lulu|elante|ub city|nexus|ambience|seawoods|express/.test(m)) {
    const q = unit?.[1] || (phoenix ? "phoenix" : message);
    calls.push({ tool: "find_outlet", args: { query: String(q) } });
  }
  if (!calls.length) {
    calls.push({ tool: "rent_roll", args: {} });
    calls.push({ tool: "escalations_due", args: { days: 90 } });
  }
  return calls;
}
