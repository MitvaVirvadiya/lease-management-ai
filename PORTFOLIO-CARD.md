# Lease OS — wax-seal counsel

**Thesis:** Trust an extracted retail lease enough to commit it — vellum instrument, wax-stamped fields, then outlet + schedule + dates.

**Stack:** Next.js 15 · Park UI (Ark + Panda) · NestJS · Drizzle · Postgres (`DATABASE_URL`) · Gemini extract (rules fallback)

**Shots:**
1. Blotter — “₹X a month is sealed and trading” + Unit 214 awaiting seal
2. Review — vellum folio with wax pins; notice field faint at 60 days
3. Counsel — “which outlets escalate in 90 days?” with foil lease-code citations

**Resume:**
- Extracted 50+ commercial-lease fields via Gemini structured output (Zod-checked) with a deterministic Schedule I fallback so the demo runs without a key.
- Commit writes outlet, CAM-aware rent schedule, and critical-date alerts; NL chat may only quote tool results from Postgres.

**Run:** from repo root `docker compose up -d`, then `npm install && npm run db:push && npm run db:seed && npm run dev:api && npm run dev:web` → http://localhost:3015

**2-minute demo:** Open Phoenix Unit 214 → fix notice 60 → 90 → Seal & commit → show schedule + expiry alert → ask chat the 90-day escalation question → drag the card to Active.
