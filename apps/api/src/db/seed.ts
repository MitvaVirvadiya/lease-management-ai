import { config } from "dotenv";
import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";
import { eq } from "drizzle-orm";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { renderInstrument } from "../seed/instrument";
import { PORTFOLIO } from "../seed/portfolio";
import { FIELD_CATALOG, STAGES } from "../fields/catalog";
import {
  generateAlerts,
  generateObligations,
  generateSchedule,
} from "../ops/engines";
import { extractWithRules } from "../extract/rules";

config({ path: resolve(__dirname, "../../../../.env") });
config({ path: resolve(__dirname, "../../.env") });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const { db, client } = await import("./client");
  const schema = await import("./schema");

  await db.delete(schema.chatMessages);
  await db.delete(schema.chatThreads);
  await db.delete(schema.alerts);
  await db.delete(schema.paymentSchedules);
  await db.delete(schema.obligations);
  await db.delete(schema.outlets);
  await db.delete(schema.leaseFields);
  await db.delete(schema.leases);
  await db.delete(schema.pipelineStages);

  await db.insert(schema.pipelineStages).values([...STAGES]);

  const sampleDir = resolve(__dirname, "../../../../data/samples");
  await mkdir(sampleDir, { recursive: true });

  for (const sample of PORTFOLIO) {
    const rawText = renderInstrument(sample);
    await writeFile(resolve(sampleDir, `${sample.slug}.txt`), rawText, "utf8");
    if (sample.sourceType === "scan" || sample.slug === "phoenix-214-kettle") {
      await writePdf(resolve(sampleDir, `${sample.slug}.pdf`), rawText, sample.title);
    }

    const useExtractor = !sample.committed;
    const extracted = useExtractor
      ? extractWithRules(rawText, { slug: sample.slug })
      : FIELD_CATALOG.map((def) => ({
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

    const [lease] = await db
      .insert(schema.leases)
      .values({
        code: sample.code,
        title: sample.title,
        slug: sample.slug,
        fileName: `${sample.slug}.txt`,
        sourceType: sample.sourceType,
        extractMode: "rules",
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

    await db.insert(schema.leaseFields).values(
      extracted.map((f) => ({
        leaseId: lease.id,
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

    if (sample.committed) {
      const map = sample.fields;
      const [outlet] = await db
        .insert(schema.outlets)
        .values({
          leaseId: lease.id,
          code: `OT-${sample.code.replace(/^LS-/, "")}`,
          brand: sample.brand,
          mall: sample.mall,
          unit: sample.unit,
          address: map.address,
          city: sample.city,
          state: sample.state,
          areaSqft: Number(map.area_sqft || 0),
          status: sample.stage === "exit" ? "exiting" : "trading",
          openedAt: map.rent_commencement_date,
        })
        .returning();

      const obs = generateObligations(map);
      await db.insert(schema.obligations).values(
        obs.map((o) => ({ leaseId: lease.id, outletId: outlet.id, ...o })),
      );
      const sched = generateSchedule(map);
      await db.insert(schema.paymentSchedules).values(
        sched.map((s) => ({ leaseId: lease.id, outletId: outlet.id, ...s })),
      );
      const al = generateAlerts(map, sample.code);
      await db.insert(schema.alerts).values(
        al.map((a) => ({
          leaseId: lease.id,
          outletId: outlet.id,
          ...a,
          status: "open",
        })),
      );
      await db
        .update(schema.leases)
        .set({ committed: true, committedAt: new Date(), stage: sample.stage })
        .where(eq(schema.leases.id, lease.id));
    }
  }

  console.log(`Seeded ${PORTFOLIO.length} instruments into lease_os.`);
  await client.end({ timeout: 5 });
}

function latin(s: string) {
  return s
    .replace(/₹/g, "Rs.")
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/★/g, "*")
    .replace(/×/g, "x")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

async function writePdf(path: string, text: string, title: string) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const pages = wrap(latin(text), 86);
  for (const chunk of pages) {
    const page = doc.addPage([595, 842]);
    page.drawText(latin(title).slice(0, 80), {
      x: 48,
      y: 800,
      size: 10,
      font,
    });
    page.drawText(chunk, {
      x: 48,
      y: 772,
      size: 9,
      font,
      lineHeight: 12,
      maxWidth: 500,
    });
  }
  const bytes = await doc.save();
  await writeFile(path, bytes);
}

function wrap(text: string, width: number): string[] {
  const lines = text.split("\n");
  const out: string[] = [];
  let buf: string[] = [];
  let count = 0;
  for (const line of lines) {
    const wrapped = line.length > width ? chunkLine(line, width) : [line];
    for (const w of wrapped) {
      buf.push(w);
      count += 1;
      if (count >= 58) {
        out.push(buf.join("\n"));
        buf = [];
        count = 0;
      }
    }
  }
  if (buf.length) out.push(buf.join("\n"));
  return out.length ? out : [text];
}

function chunkLine(line: string, width: number): string[] {
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += width) parts.push(line.slice(i, i + width));
  return parts;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
