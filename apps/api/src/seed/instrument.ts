import { inr } from "../common/format";
import { FIELD_CATALOG } from "../fields/catalog";
import type { SeedLease } from "./portfolio";

function moneyish(key: string, value: string): string {
  const def = FIELD_CATALOG.find((f) => f.key === key);
  if (def?.valueType === "money") return inr(Number(value));
  if (def?.valueType === "boolean") return value === "true" ? "Yes" : "No";
  if (def?.valueType === "percent") return `${value}%`;
  return value;
}

export function renderInstrument(lease: SeedLease): string {
  const f = lease.fields;
  const scanNoise =
    lease.sourceType === "scan"
      ? `

[SCAN ARTEFACT — page 1 gutter]
…lessor c/o  the mall office / OCR conf 0.71
UNIT ${f.unit_number}  flr ${f.floor}   sq.ft ${f.area_sqft}
hand initials in margin: “ok — SD”
`
      : "";

  const phoenixQuirk =
    lease.slug === "phoenix-214-kettle"
      ? `
CLAUSE 8.2 — FIT-OUT
The Lessee shall complete the initial fit-out within sixty (60) days of possession. Delay beyond sixty (60) days attracts holding charges.

CLAUSE 12.1 — NOTICE TO QUIT
Notwithstanding the fit-out window, either party intending not to renew shall give written notice of ninety (90) days prior to the expiration date. A notice of sixty days is not sufficient.
`
      : `
CLAUSE 12.1 — NOTICE TO QUIT
Either party shall give written notice of ${f.notice_period_days} days prior to expiration or earlier determination.
`;

  const lines = FIELD_CATALOG.map((def, i) => {
    const raw = f[def.key] ?? "";
    return `${String(i + 1).padStart(2, "0")}. ${def.label}: ${moneyish(def.key, raw)}`;
  }).join("\n");

  return `DEED OF LEASE
(Commercial — Retail Outlet)

THIS DEED OF LEASE is made at ${f.city} on the commencement date set out in Schedule I.

BETWEEN

${f.lessor_name} (CIN ${f.lessor_cin}), the “Lessor”;

AND

${f.lessee_name} (CIN ${f.lessee_cin}), trading as “${f.lessee_brand}”, the “Lessee”;

AND

${f.guarantor}, as Guarantor (if any).

WHEREAS the Lessor is seized of the premises described in Schedule I at ${f.mall_name}, and the Lessee wishes to take the same on lease for the permitted use.

NOW THIS DEED WITNESSES as follows.

CLAUSE 1 — DEMISE
The Lessor demises to the Lessee Unit ${f.unit_number} on ${f.floor} of ${f.mall_name}, admeasuring ${f.area_sqft} sq ft carpet, situated at ${f.address}, together with the right to use common areas in common with other occupants.

CLAUSE 2 — TERM
The term is ${f.term_years} years commencing ${f.commencement_date} and expiring ${f.expiration_date}, unless sooner determined. Possession was (or shall be) given on ${f.possession_date}. Rent commences ${f.rent_commencement_date}.

CLAUSE 3 — LOCK-IN
The parties are locked in for ${f.lock_in_years} years, ending ${f.lock_in_end}. During lock-in the Lessee shall not determine this deed except for Lessor default.

CLAUSE 4 — RENT
Monthly base rent is ${inr(Number(f.base_rent_monthly))} (${f.rent_currency}), being approximately ${inr(Number(f.base_rent_psf))} per sq ft. Rent shall escalate by ${f.escalation_percent}% ${f.escalation_frequency}, next on ${f.next_escalation_date}. The first ${f.free_rent_months} month(s) from rent commencement are free of base rent (CAM remains payable). Turnover rent of ${f.turnover_rent_percent}% of net sales applies if annual sales exceed 2.5× annual base rent.

CLAUSE 5 — CAM AND OTHER CHARGES
CAM ${inr(Number(f.cam_monthly))} per month; HVAC ${inr(Number(f.hvac_monthly))}; parking ${inr(Number(f.parking_monthly))}; marketing fund ${inr(Number(f.marketing_fund_monthly))}. GST is ${f.gst_applicable === "true" ? "" : "not "}applicable on rent and CAM.

CLAUSE 6 — DEPOSITS
Interest-free security deposit of ${inr(Number(f.security_deposit))} (equal to ${f.security_deposit_months} months’ base rent), plus fit-out deposit ${inr(Number(f.fitout_deposit))}. Deposit ${f.deposit_interest === "true" ? "shall" : "shall not"} bear interest. The Lessor may draw against the deposit for unpaid dues on seven days’ notice.

CLAUSE 7 — PAYMENT
Rent and charges are payable on or before the ${f.payment_day}th day of each month, ${f.billing_cycle.toLowerCase()}, by ${f.payment_mode}. Late payment attracts ${f.late_fee_percent}% per month.

${phoenixQuirk}

CLAUSE 9 — USE AND RADIUS
Permitted use: ${f.use_clause}. Exclusive: ${f.exclusive_use}. The Lessee shall not open a competing outlet within ${f.radius_restriction_km} km of the mall entrance.

CLAUSE 10 — OPTIONS
Renewal option: ${f.renewal_option === "true" ? `yes, ${f.renewal_term_years} years, notice ${f.renewal_notice_days} days` : "none"}.
Expansion / ROFR: ${f.expansion_option === "true" ? "yes" : "no"}.
Early termination (post lock-in): ${f.termination_option === "true" ? "yes" : "no"}.

CLAUSE 11 — COMPLIANCE
Public liability insurance of not less than ${inr(Number(f.insurance_amount))}. Signage: ${f.signage_rights}. Assignment: ${f.assignment_consent}. Fit-out period: ${f.fitout_period_days} days.

CLAUSE 13 — NOTICES
Notices to the Lessee at: ${f.notice_address}.

IN WITNESS WHEREOF the parties have executed this deed.

————————————————————————————————
SCHEDULE I — PARTICULARS OF THE DEMISE
Instrument ${lease.code} · ${lease.title}

${lines}
${scanNoise}

Page ends. This is a synthetic instrument for the Lease OS demonstration. It is not a real contract and names of malls are used as setting only.
`;
}

export function paginateInstrument(text: string): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n{2,}/);
  let buf = "";
  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length > 1400 && buf) {
      chunks.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.length ? chunks : [text];
}
