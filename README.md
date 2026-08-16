# Lease OS — Wax-seal counsel

In-house real-estate counsel for **Northstar Retail**: upload a commercial lease, extract 50+ fields, human-seal the particulars, then commit an outlet, rent schedule, and critical-date alerts. A six-stage matter pipeline and a tool-grounded portfolio chat sit on top.

This is a designed product for counsel + store development — not a CRM grid.

---

## Visual identity

**Name:** Wax-seal counsel  
**Audience:** in-house real-estate counsel and store development  
**Job:** trust an extracted lease enough to commit it

| Token | Hex | Role |
|-------|-----|------|
| Vellum | `#F3EEE6` | Paper *inside* the review surface only |
| Ink navy | `#1E2430` | App chrome / blotter |
| Wax | `#7A1F2B` | Seals, commit, critical dates |
| Foil | `#C4A574` | Hairlines, codes, focus |
| Obligation | `#2F3A2E` | Sealed / trading |

**Type:** Source Serif 4 (clauses, titles) + IBM Plex Sans (ops) + IBM Plex Mono (codes, rupees). No Inter.

**Layout thesis:** leather blotter, not a SaaS dashboard. The shell is ink navy. Vellum appears only when an instrument is open. The first impression is a counsel brief (“₹X a month is sealed and trading”), not a card grid.

**Signature:** extracted fields pin onto a paginated lease as **wax-stamped callouts**. Commit is a seal, not a save.

---

## Stack

| Layer | Choice |
|-------|--------|
| Web | Next.js 15 · Park UI (Ark UI + Panda CSS) |
| API | NestJS |
| ORM | Drizzle + postgres.js |
| Database | PostgreSQL via `DATABASE_URL` only |
| Extract | Gemini (`GEMINI_API_KEY`) with Zod check; rules extractor if the key is unset |
| Chat | Tool-calling over `expiring_in`, `escalations_due`, `deposit_at_risk`, `rent_roll`, `find_outlet` |

```
Next.js 15  :3005
    │  REST
NestJS      :4005
    │  Drizzle / postgres.js
Postgres    DATABASE_URL  (local compose / Neon / Supabase)
    │
Gemini (optional)  — extract + chat prose
Rules counsel      — always available
```

Point this at Neon / Supabase / local by changing `DATABASE_URL` only. There are no provider branches in code. `sslmode` comes from the URL.

---

## Run locally

```bash
cp .env.example .env          # already wired for local compose
docker compose -f ../docker-compose.yml --project-directory .. up -d
npm install
npm run db:push
npm run db:seed
npm run dev:api               # :4005
npm run dev:web               # :3015
```

Open `http://localhost:3015`. Health: `http://localhost:4005/health`.

`db:seed` is idempotent in the demo sense: it rebuilds the 12-instrument blotter to a known state.

Without `GEMINI_API_KEY` the product still runs. Extract uses the Schedule I particulars parser (Phoenix Unit 214 deliberately misreads notice as 60 days). Chat answers from SQL-ish tools and is labeled **Rules counsel (model offline)**.

---

## 2-minute demo

1. Blotter → **Open Unit 214** (or Docket → **Phoenix Unit 214**).
2. On the vellum, the notice pin is faint (60 days). Change **Notice (days)** to `90`. Save. **Seal & commit**.
3. Open the **Schedule** and **Dates** tabs — monthly rent + CAM, expiry and option-window alerts.
4. Counsel → “Which outlets escalate in 90 days?” — answers cite `LS-PLD-118`, `LS-SCW-B22`, `LS-UBC-04`, `LS-NXK-310`.
5. Matters → drag `LS-PHX-214` from Review to **Active**.

---

## Portfolio (12 synthetic Indian retail leases)

Lessee is always **Northstar Retail Private Limited**, trading as Kettle & Copper, Northstar Atelier, Volt Athletica, Ink & Ivory, Loom & Last, or Marrow.

| Code | Mall / unit | Stage | Notes |
|------|-------------|-------|-------|
| LS-PHX-214 | Phoenix Marketcity 214 | Review | Demo extract; notice misread |
| LS-PLD-118 | Phoenix Palladium G-118 | Active | Escalates 15 Sep 2026 |
| LS-SCW-B22 | Select Citywalk B-22 | Active | Escalates 1 Oct 2026 |
| LS-UBC-04 | UB City 04 | Escalation | Step due 20 Aug 2026 |
| LS-NXK-310 | Nexus Koramangala 310 | Active | Escalates 1 Nov 2026 |
| LS-VRP-A12 | VR Punjab A-12 | Active | 3-month deposit, at risk |
| LS-EXA-L5 | Express Avenue L5-09 | Review | Unsealed |
| LS-FRM-221 | Forum Sujana 221 | Extract | Scan |
| LS-ELT-G07 | Elante G-07 | Active | Trading |
| LS-LLU-F18 | Lulu F-18 | Exit | Expires 30 Sep 2026 |
| LS-AMB-S4 | Ambience S-4 | Intake | Scan, not extracted for commit |
| LS-SWG-P02 | Seawoods P-02 | Active | Trading |

Instruments live in `data/samples/` after seed (text + a few generated PDFs).

---

## Scripts

| Script | What |
|--------|------|
| `npm run db:generate` | Drizzle generate |
| `npm run db:migrate` | Drizzle migrate |
| `npm run db:push` | Push schema |
| `npm run db:seed` | Rebuild blotter + write samples |

---

## Resume bullets

- Built an AI lease-ops console that extracts 50+ commercial-lease fields (Gemini structured JSON or a deterministic Schedule I parser) into a reviewed, Zod-checked schema.
- On commit, generates the outlet, CAM-aware monthly schedule, obligations, and critical-date alerts across a six-stage counsel pipeline.
- Portfolio chat answers expiry, escalation, and deposit questions only from Postgres tools — it cannot invent rupees.

## Interview talking points

- Why a human seal is mandatory: extraction will happily read “sixty (60) days” from a fit-out clause as notice.
- Why chat is tool-only: counsel will not forgive a hallucinated rent step.
- `DATABASE_URL` portability — same Drizzle client for local, Neon, or Supabase.

## Out of scope

E-sign, accounting export, native mobile.
