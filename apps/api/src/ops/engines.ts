import {
  addDays,
  addMonths,
  daysBetween,
  lastDayOfMonth,
  parseBool,
  parseMoney,
  todayISO,
} from "../common/format";

export type FieldMap = Record<string, string>;

export type ScheduleRow = {
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  rentAmount: number;
  camAmount: number;
  otherAmount: number;
  totalAmount: number;
  status: "scheduled" | "due" | "paid" | "free";
  notes: string;
};

export type AlertDraft = {
  type: "expiry" | "option_window" | "deposit" | "escalation";
  severity: "critical" | "watch" | "info";
  title: string;
  body: string;
  dueDate: string;
};

export type ObligationDraft = {
  type: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: string;
};

function cadenceMonths(freq: string): number {
  if (/annual|year/i.test(freq) && !/3/.test(freq)) return 12;
  if (/3/.test(freq)) return 36;
  if (/month/i.test(freq)) return 1;
  return 36;
}

export function generateSchedule(fields: FieldMap, today = todayISO()): ScheduleRow[] {
  const start = fields.rent_commencement_date;
  const end = fields.expiration_date;
  if (!start || !end) return [];

  const base = parseMoney(fields.base_rent_monthly);
  const cam = parseMoney(fields.cam_monthly);
  const other =
    parseMoney(fields.hvac_monthly) +
    parseMoney(fields.parking_monthly) +
    parseMoney(fields.marketing_fund_monthly);
  const freeMonths = Number(fields.free_rent_months || 0);
  const pct = Number(fields.escalation_percent || 0);
  const every = cadenceMonths(fields.escalation_frequency || "");
  const payDay = Math.min(28, Math.max(1, Number(fields.payment_day || 7)));

  const nextEsc = fields.next_escalation_date || "";
  const rows: ScheduleRow[] = [];
  let cursor = start.slice(0, 8) + "01";
  if (cursor < start) cursor = start;
  let monthIndex = 0;

  while (cursor <= end && rows.length < 120) {
    const periodEnd = lastDayOfMonth(cursor) > end ? end : lastDayOfMonth(cursor);
    // base_rent_monthly is the current passing rent. Apply further steps only
    // on/after next_escalation_date so we do not double-count history.
    let steps = 0;
    if (nextEsc && cursor >= nextEsc) {
      const monthsPast = Math.max(0, Math.round(daysBetween(nextEsc, cursor) / 30));
      steps = 1 + Math.floor(monthsPast / every);
    }
    const escalated = Math.round(base * Math.pow(1 + pct / 100, steps));
    const isFree = monthIndex < freeMonths;
    const rent = isFree ? 0 : escalated;
    const dueDay = String(payDay).padStart(2, "0");
    const dueDate = `${cursor.slice(0, 8)}${dueDay}`;
    let status: ScheduleRow["status"] = "scheduled";
    if (periodEnd < today) status = "paid";
    else if (dueDate <= today) status = "due";
    if (isFree) status = periodEnd < today ? "paid" : "free";

    const notes: string[] = [];
    if (isFree) notes.push("Free-rent month — CAM still due");
    if (steps > 0 && monthIndex % every === 0 && !isFree) {
      notes.push(`Escalation ×${steps} applied (${pct}%)`);
    }

    rows.push({
      periodStart: cursor,
      periodEnd,
      dueDate: dueDate > periodEnd ? periodEnd : dueDate,
      rentAmount: rent,
      camAmount: cam,
      otherAmount: other,
      totalAmount: rent + cam + other,
      status,
      notes: notes.join(" · "),
    });

    cursor = addMonths(cursor.slice(0, 8) + "01", 1);
    monthIndex += 1;
  }
  return rows;
}

export function generateAlerts(fields: FieldMap, leaseCode: string, today = todayISO()): AlertDraft[] {
  const alerts: AlertDraft[] = [];
  const exp = fields.expiration_date;
  if (exp) {
    const d = daysBetween(today, exp);
    alerts.push({
      type: "expiry",
      severity: d <= 90 ? "critical" : d <= 180 ? "watch" : "info",
      title: `${leaseCode} expires ${exp}`,
      body: `Term ends on ${exp} (${d} days). Unit ${fields.unit_number} at ${fields.mall_name}.`,
      dueDate: exp,
    });
    const notice = Number(fields.renewal_notice_days || fields.notice_period_days || 90);
    if (notice > 0) {
      const windowOpen = addDays(exp, -notice);
      const d2 = daysBetween(today, windowOpen);
      alerts.push({
        type: "option_window",
        severity: d2 <= 0 && d > 0 ? "critical" : d2 <= 60 ? "watch" : "info",
        title: `Renewal window ${windowOpen} · ${leaseCode}`,
        body: `Give ${notice} days’ notice to exercise renewal (${fields.renewal_term_years || "—"} years). Window opens ${windowOpen}.`,
        dueDate: windowOpen,
      });
    }
  }

  const nextEsc = fields.next_escalation_date;
  if (nextEsc) {
    const d = daysBetween(today, nextEsc);
    alerts.push({
      type: "escalation",
      severity: d <= 0 ? "critical" : d <= 90 ? "watch" : "info",
      title: `Rent steps ${nextEsc} · ${leaseCode}`,
      body: `Base rent ${fields.base_rent_monthly} escalates ${fields.escalation_percent}% (${fields.escalation_frequency}) on ${nextEsc}.`,
      dueDate: nextEsc,
    });
  }

  const months = Number(fields.security_deposit_months || 0);
  const interest = parseBool(fields.deposit_interest);
  if (months > 0 && (months < 6 || !interest)) {
    alerts.push({
      type: "deposit",
      severity: months < 4 ? "critical" : "watch",
      title: `Deposit cover thin · ${leaseCode}`,
      body: `${months} months’ rent as deposit${interest ? "" : ", no interest"}. Lessor may draw on seven days’ notice.`,
      dueDate: today,
    });
  }

  return alerts;
}

export function generateObligations(fields: FieldMap): ObligationDraft[] {
  return [
    {
      type: "lock_in",
      title: "Lock-in",
      description: `${fields.lock_in_years} years, ends ${fields.lock_in_end}.`,
      dueDate: fields.lock_in_end || null,
      status: fields.lock_in_end && fields.lock_in_end < todayISO() ? "satisfied" : "open",
    },
    {
      type: "insurance",
      title: "Public liability cover",
      description: `Maintain cover of ₹${Number(fields.insurance_amount || 0).toLocaleString("en-IN")}.`,
      dueDate: null,
      status: "open",
    },
    {
      type: "radius",
      title: "Radius restriction",
      description: `No competing ${fields.lessee_brand} within ${fields.radius_restriction_km} km.`,
      dueDate: fields.expiration_date || null,
      status: "open",
    },
    {
      type: "deposit",
      title: "Security deposit",
      description: `${fields.security_deposit_months} months · ₹${Number(fields.security_deposit || 0).toLocaleString("en-IN")}.`,
      dueDate: null,
      status: "open",
    },
    {
      type: "notice",
      title: "Notice to quit",
      description: `${fields.notice_period_days} days written notice.`,
      dueDate: fields.expiration_date || null,
      status: "open",
    },
  ];
}

export function mapFromFields(
  rows: { key: string; value: string | null }[],
): FieldMap {
  const map: FieldMap = {};
  for (const r of rows) {
    if (r.value != null) map[r.key] = r.value;
  }
  return map;
}
