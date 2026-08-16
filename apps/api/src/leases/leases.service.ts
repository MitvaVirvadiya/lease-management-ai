import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  alerts,
  leaseFields,
  leases,
  obligations,
  outlets,
  paymentSchedules,
  pipelineStages,
} from "../db/schema";
import { FIELD_CATALOG, STAGES, type StageSlug } from "../fields/catalog";
import { ExtractService } from "../extract/extract.service";
import type { ExtractedField } from "../extract/types";
import {
  generateAlerts,
  generateObligations,
  generateSchedule,
  mapFromFields,
} from "../ops/engines";
import { paginateInstrument, renderInstrument } from "../seed/instrument";
import { PORTFOLIO, type SeedLease } from "../seed/portfolio";
import { parseMoney } from "../common/format";

const STAGE_SLUGS = new Set(STAGES.map((s) => s.slug));

@Injectable()
export class LeasesService {
  constructor(@Inject(ExtractService) private readonly extract: ExtractService) {}

  async list() {
    const rows = await db.select().from(leases).orderBy(asc(leases.code));
    const alertCounts = await db
      .select({
        leaseId: alerts.leaseId,
        n: sql<number>`count(*)::int`,
      })
      .from(alerts)
      .where(eq(alerts.status, "open"))
      .groupBy(alerts.leaseId);
    const countMap = new Map(alertCounts.map((a) => [a.leaseId, a.n]));

    const rentRows = await db
      .select()
      .from(leaseFields)
      .where(eq(leaseFields.key, "base_rent_monthly"));
    const rentMap = new Map(rentRows.map((r) => [r.leaseId, r.value]));

    const expRows = await db
      .select()
      .from(leaseFields)
      .where(eq(leaseFields.key, "expiration_date"));
    const expMap = new Map(expRows.map((r) => [r.leaseId, r.value]));

    return rows.map((l) => ({
      id: l.id,
      code: l.code,
      title: l.title,
      slug: l.slug,
      brand: l.brand,
      mall: l.mall,
      unit: l.unit,
      city: l.city,
      state: l.state,
      stage: l.stage,
      committed: l.committed,
      sourceType: l.sourceType,
      extractMode: l.extractMode,
      monthlyRent: parseMoney(rentMap.get(l.id) ?? "0"),
      expirationDate: expMap.get(l.id) ?? null,
      alertCount: countMap.get(l.id) ?? 0,
      updatedAt: l.updatedAt,
    }));
  }

  async get(id: string) {
    const [lease] = await db.select().from(leases).where(eq(leases.id, id));
    if (!lease) throw new NotFoundException("Lease not on the blotter");
    const fields = await db
      .select()
      .from(leaseFields)
      .where(eq(leaseFields.leaseId, id));
    const [outlet] = await db.select().from(outlets).where(eq(outlets.leaseId, id));
    const obs = await db
      .select()
      .from(obligations)
      .where(eq(obligations.leaseId, id));
    const schedule = await db
      .select()
      .from(paymentSchedules)
      .where(eq(paymentSchedules.leaseId, id))
      .orderBy(asc(paymentSchedules.periodStart));
    const al = await db
      .select()
      .from(alerts)
      .where(eq(alerts.leaseId, id))
      .orderBy(asc(alerts.dueDate));

    return {
      ...lease,
      pages: paginateInstrument(lease.rawText),
      fields,
      outlet: outlet ?? null,
      obligations: obs,
      schedule,
      alerts: al,
    };
  }

  async stages() {
    return db.select().from(pipelineStages).orderBy(asc(pipelineStages.sortOrder));
  }

  async pipeline() {
    const items = await this.list();
    const cols = STAGES.map((s) => ({
      ...s,
      leases: items.filter((l) => l.stage === s.slug),
    }));
    return cols;
  }

  async samples() {
    return PORTFOLIO.map((p) => ({
      slug: p.slug,
      code: p.code,
      title: p.title,
      brand: p.brand,
      mall: p.mall,
      unit: p.unit,
      city: p.city,
      sourceType: p.sourceType,
      highlight: p.highlight ?? null,
    }));
  }

  async loadSample(slug: string) {
    const sample = PORTFOLIO.find((p) => p.slug === slug);
    if (!sample) throw new NotFoundException("Sample instrument not found");

    const [existing] = await db
      .select()
      .from(leases)
      .where(eq(leases.slug, slug));
    if (existing) return this.get(existing.id);

    return this.ingestFromSeed(sample, { runExtractor: true });
  }

  async upload(file: { originalname: string; buffer: Buffer; mimetype: string }) {
    const name = file.originalname.toLowerCase();
    const matched = PORTFOLIO.find(
      (p) =>
        name.includes(p.slug) ||
        name.includes(p.code.toLowerCase()) ||
        (name.includes("phoenix") && name.includes("214")),
    );

    let rawText = "";
    if (file.mimetype.includes("text") || name.endsWith(".txt") || name.endsWith(".html")) {
      rawText = file.buffer.toString("utf8");
    } else if (matched) {
      rawText = renderInstrument(matched);
    } else {
      rawText = await this.readPdfText(file.buffer);
    }

    if (!rawText.trim()) {
      throw new BadRequestException(
        "Could not read this instrument. Load a sample or upload a text-layer PDF.",
      );
    }

    const slug = matched?.slug ?? `upload-${Date.now()}`;
    const extracted = await this.extract.extract({
      rawText,
      slug,
      pdf: file.mimetype.includes("pdf")
        ? { buffer: file.buffer, mimeType: file.mimetype }
        : undefined,
    });

    const brand =
      extracted.fields.find((f) => f.key === "lessee_brand")?.value ||
      matched?.brand ||
      "Unknown brand";
    const mall =
      extracted.fields.find((f) => f.key === "mall_name")?.value ||
      matched?.mall ||
      "Unknown mall";
    const unit =
      extracted.fields.find((f) => f.key === "unit_number")?.value ||
      matched?.unit ||
      "—";
    const city =
      extracted.fields.find((f) => f.key === "city")?.value ||
      matched?.city ||
      "—";
    const code = matched?.code ?? `LS-UPL-${Date.now().toString().slice(-6)}`;

    const [created] = await db
      .insert(leases)
      .values({
        code,
        title: `${mall} · Unit ${unit} · ${brand}`,
        slug: `${slug}-${Date.now()}`,
        fileName: file.originalname,
        sourceType: matched?.sourceType ?? "digital",
        extractMode: extracted.mode,
        stage: "review",
        committed: false,
        brand,
        mall,
        unit,
        city,
        state: extracted.fields.find((f) => f.key === "state")?.value ?? null,
        rawText: extracted.rawText,
      })
      .returning();

    await this.replaceFields(created.id, extracted.fields);
    return this.get(created.id);
  }

  async patchFields(
    id: string,
    updates: { key: string; value: string | null }[],
  ) {
    const [lease] = await db.select().from(leases).where(eq(leases.id, id));
    if (!lease) throw new NotFoundException("Lease not on the blotter");

    for (const u of updates) {
      await db
        .update(leaseFields)
        .set({ value: u.value, edited: true, confidence: 1 })
        .where(and(eq(leaseFields.leaseId, id), eq(leaseFields.key, u.key)));
    }

    const brand = updates.find((u) => u.key === "lessee_brand")?.value;
    const mall = updates.find((u) => u.key === "mall_name")?.value;
    const unit = updates.find((u) => u.key === "unit_number")?.value;
    const city = updates.find((u) => u.key === "city")?.value;
    if (brand || mall || unit || city) {
      await db
        .update(leases)
        .set({
          brand: brand || lease.brand,
          mall: mall || lease.mall,
          unit: unit || lease.unit,
          city: city || lease.city,
          updatedAt: new Date(),
        })
        .where(eq(leases.id, id));
    } else {
      await db
        .update(leases)
        .set({ updatedAt: new Date() })
        .where(eq(leases.id, id));
    }
    return this.get(id);
  }

  async commit(id: string) {
    const detail = await this.get(id);
    const missing = detail.fields.filter(
      (f) => f.required && (f.value == null || f.value === ""),
    );
    if (missing.length) {
      throw new BadRequestException({
        message: "Seal refused — required fields are blank",
        missing: missing.map((m) => m.key),
      });
    }

    const map = mapFromFields(detail.fields);
    await db.delete(outlets).where(eq(outlets.leaseId, id));
    await db.delete(obligations).where(eq(obligations.leaseId, id));
    await db.delete(paymentSchedules).where(eq(paymentSchedules.leaseId, id));
    await db.delete(alerts).where(eq(alerts.leaseId, id));

    const [outlet] = await db
      .insert(outlets)
      .values({
        leaseId: id,
        code: `OT-${detail.code.replace(/^LS-/, "")}`,
        brand: map.lessee_brand || detail.brand,
        mall: map.mall_name || detail.mall,
        unit: map.unit_number || detail.unit,
        address: map.address || "",
        city: map.city || detail.city,
        state: map.state || detail.state,
        areaSqft: Number(map.area_sqft || 0),
        status: "trading",
        openedAt: map.rent_commencement_date || map.commencement_date || null,
      })
      .returning();

    const obs = generateObligations(map);
    if (obs.length) {
      await db.insert(obligations).values(
        obs.map((o) => ({
          leaseId: id,
          outletId: outlet.id,
          ...o,
        })),
      );
    }

    const sched = generateSchedule(map);
    if (sched.length) {
      await db.insert(paymentSchedules).values(
        sched.map((s) => ({
          leaseId: id,
          outletId: outlet.id,
          ...s,
        })),
      );
    }

    const al = generateAlerts(map, detail.code);
    if (al.length) {
      await db.insert(alerts).values(
        al.map((a) => ({
          leaseId: id,
          outletId: outlet.id,
          ...a,
          status: "open",
        })),
      );
    }

    await db
      .update(leases)
      .set({ committed: true, committedAt: new Date(), updatedAt: new Date() })
      .where(eq(leases.id, id));

    return this.get(id);
  }

  async setStage(id: string, stage: string) {
    if (!STAGE_SLUGS.has(stage as StageSlug)) {
      throw new BadRequestException("Unknown pipeline stage");
    }
    const [lease] = await db.select().from(leases).where(eq(leases.id, id));
    if (!lease) throw new NotFoundException("Lease not on the blotter");
    await db
      .update(leases)
      .set({ stage, updatedAt: new Date() })
      .where(eq(leases.id, id));
    return this.get(id);
  }

  async dashboard() {
    const items = await this.list();
    const committed = items.filter((l) => l.committed && l.stage !== "intake");
    const monthly = committed
      .filter((l) => l.stage === "active" || l.stage === "escalation" || l.stage === "exit")
      .reduce((s, l) => s + l.monthlyRent, 0);
    const openAlerts = await db
      .select()
      .from(alerts)
      .where(eq(alerts.status, "open"))
      .orderBy(asc(alerts.dueDate));

    const causeList = openAlerts.slice(0, 8).map((a) => ({
      id: a.id,
      leaseId: a.leaseId,
      type: a.type,
      severity: a.severity,
      title: a.title,
      dueDate: a.dueDate,
    }));

    const byStage = STAGES.map((s) => ({
      slug: s.slug,
      name: s.name,
      count: items.filter((l) => l.stage === s.slug).length,
    }));

    const awaitingSeal = items.filter((l) => l.stage === "review" && !l.committed);

    return {
      asOf: new Date().toISOString(),
      matterCount: items.length,
      sealedCount: committed.length,
      monthlyRent: monthly,
      annualRent: monthly * 12,
      openAlertCount: openAlerts.length,
      criticalAlertCount: openAlerts.filter((a) => a.severity === "critical").length,
      byStage,
      causeList,
      awaitingSeal,
    };
  }

  async alertList() {
    const rows = await db
      .select({
        alert: alerts,
        code: leases.code,
        brand: leases.brand,
        mall: leases.mall,
        unit: leases.unit,
      })
      .from(alerts)
      .innerJoin(leases, eq(alerts.leaseId, leases.id))
      .orderBy(asc(alerts.dueDate));
    return rows.map((r) => ({ ...r.alert, leaseCode: r.code, brand: r.brand, mall: r.mall, unit: r.unit }));
  }

  async ingestFromSeed(sample: SeedLease, opts: { runExtractor: boolean }) {
    const rawText = renderInstrument(sample);
    let extractedFields: ExtractedField[];
    let mode: "gemini" | "rules" = "rules";

    if (opts.runExtractor) {
      const extracted = await this.extract.extract({ rawText, slug: sample.slug });
      extractedFields = extracted.fields;
      mode = extracted.mode;
    } else {
      extractedFields = FIELD_CATALOG.map((def) => ({
        key: def.key,
        label: def.label,
        category: def.category,
        value: sample.fields[def.key] ?? null,
        valueType: def.valueType,
        confidence: 0.97,
        sourcePage: def.page,
        sourcePhrase: def.label,
        required: def.required,
      }));
    }

    const [created] = await db
      .insert(leases)
      .values({
        code: sample.code,
        title: sample.title,
        slug: sample.slug,
        fileName: `${sample.slug}.txt`,
        sourceType: sample.sourceType,
        extractMode: mode,
        stage: sample.stage,
        committed: false,
        brand: sample.brand,
        mall: sample.mall,
        unit: sample.unit,
        city: sample.city,
        state: sample.state,
        rawText,
      })
      .returning();

    await this.replaceFields(created.id, extractedFields);

    if (sample.committed) {
      await this.commit(created.id);
      if (sample.stage !== "review") {
        await db
          .update(leases)
          .set({ stage: sample.stage, updatedAt: new Date() })
          .where(eq(leases.id, created.id));
      }
    }
    return this.get(created.id);
  }

  private async replaceFields(leaseId: string, fields: ExtractedField[]) {
    await db.delete(leaseFields).where(eq(leaseFields.leaseId, leaseId));
    if (!fields.length) return;
    await db.insert(leaseFields).values(
      fields.map((f) => ({
        leaseId,
        key: f.key,
        label: f.label,
        category: f.category,
        value: f.value,
        valueType: f.valueType,
        confidence: f.confidence,
        sourcePage: f.sourcePage,
        sourcePhrase: f.sourcePhrase,
        required: f.required,
        edited: false,
      })),
    );
  }

  private async readPdfText(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = require("pdf-parse") as (
        b: Buffer,
      ) => Promise<{ text: string }>;
      const parsed = await pdfParse(buffer);
      return parsed.text || "";
    } catch {
      return "";
    }
  }
}
