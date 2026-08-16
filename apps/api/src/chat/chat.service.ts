import { Injectable, NotFoundException } from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { chatMessages, chatThreads } from "../db/schema";
import { geminiConfigured } from "../extract/gemini";
import {
  TOOL_IMPL,
  classifyIntent,
  type ToolHit,
  type ToolName,
} from "./tools";

type ToolRun = {
  tool: ToolName;
  args: Record<string, unknown>;
  result: unknown;
};

@Injectable()
export class ChatService {
  async listThreads() {
    return db.select().from(chatThreads).orderBy(desc(chatThreads.createdAt));
  }

  async getThread(id: string) {
    const [thread] = await db.select().from(chatThreads).where(eq(chatThreads.id, id));
    if (!thread) throw new NotFoundException("Thread not found");
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.threadId, id))
      .orderBy(asc(chatMessages.createdAt));
    return { ...thread, messages };
  }

  async ask(message: string, threadId?: string) {
    let tid = threadId;
    if (!tid) {
      const [t] = await db
        .insert(chatThreads)
        .values({ title: titleFrom(message) })
        .returning();
      tid = t.id;
    } else {
      const [t] = await db.select().from(chatThreads).where(eq(chatThreads.id, tid));
      if (!t) throw new NotFoundException("Thread not found");
    }

    await db.insert(chatMessages).values({
      threadId: tid,
      role: "user",
      content: message,
    });

    const runs = await this.runTools(message);
    const citations = collectCitations(runs);
    const fallback = formatFromTools(message, runs);
    let content = fallback;
    let mode: "gemini" | "rules" = "rules";

    if (geminiConfigured()) {
      const drafted = await this.draftWithGemini(message, runs);
      if (drafted) {
        content = drafted;
        mode = "gemini";
      }
    }

    await db.insert(chatMessages).values({
      threadId: tid,
      role: "assistant",
      content,
      citations,
      toolCalls: { mode, runs: summarizeRuns(runs) },
    });

    return this.getThread(tid);
  }

  private async runTools(message: string): Promise<ToolRun[]> {
    const calls = classifyIntent(message);
    const runs: ToolRun[] = [];
    for (const call of calls) {
      const result = await dispatch(call.tool, call.args);
      runs.push({ tool: call.tool, args: call.args, result });
    }
    return runs;
  }

  private async draftWithGemini(message: string, runs: ToolRun[]): Promise<string | null> {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
        generationConfig: { temperature: 0.2 },
      });
      const prompt = `You are in-house real-estate counsel for Northstar Retail.
Answer the question using ONLY the tool JSON below. Do not invent rupees, dates, or lease ids.
Cite lease codes in the prose. If a number is not in the JSON, say it is not on the blotter.
Keep it under 180 words. Counsel voice, not chatbot.

Question: ${message}

Tool results:
${JSON.stringify(runs, null, 2)}`;
      const res = await model.generateContent(prompt);
      return res.response.text();
    } catch (err) {
      console.warn("Gemini chat draft failed:", err);
      return null;
    }
  }
}

async function dispatch(tool: ToolName, args: Record<string, unknown>) {
  switch (tool) {
    case "expiring_in":
      return TOOL_IMPL.expiring_in(Number(args.days ?? 90));
    case "escalations_due":
      return TOOL_IMPL.escalations_due(Number(args.days ?? 90));
    case "deposit_at_risk":
      return TOOL_IMPL.deposit_at_risk();
    case "rent_roll":
      return TOOL_IMPL.rent_roll();
    case "find_outlet":
      return TOOL_IMPL.find_outlet(String(args.query ?? ""));
  }
}

function collectCitations(runs: ToolRun[]): string[] {
  const ids = new Set<string>();
  for (const run of runs) {
    const result = run.result as { outlets?: ToolHit[] } | ToolHit[] | null;
    if (Array.isArray(result)) {
      for (const h of result) ids.add(h.code);
    } else if (result && Array.isArray(result.outlets)) {
      for (const h of result.outlets) ids.add(h.code);
    }
  }
  return [...ids];
}

function summarizeRuns(runs: ToolRun[]) {
  return runs.map((r) => ({ tool: r.tool, args: r.args }));
}

function titleFrom(message: string) {
  return message.length > 48 ? `${message.slice(0, 46)}…` : message;
}

function formatFromTools(message: string, runs: ToolRun[]): string {
  const bits: string[] = [
    "Rules counsel (model offline) — figures come only from the blotter tools.",
  ];
  for (const run of runs) {
    if (run.tool === "escalations_due") {
      const hits = run.result as ToolHit[];
      const days = Number(run.args.days ?? 90);
      if (!hits.length) {
        bits.push(`No sealed outlets escalate within ${days} days.`);
        continue;
      }
      bits.push(`${hits.length} outlet${hits.length === 1 ? "" : "s"} escalate within ${days} days:`);
      for (const h of hits) {
        bits.push(
          `· ${h.code} ${h.brand}, ${h.mall} Unit ${h.unit} — ${h.facts.escalation_percent}% on ${h.facts.next_escalation_date} (${h.facts.current_rent_display} → ${h.facts.next_rent_display}).`,
        );
      }
    }
    if (run.tool === "expiring_in") {
      const hits = run.result as ToolHit[];
      const days = Number(run.args.days ?? 90);
      if (!hits.length) {
        bits.push(`No sealed outlets expire within ${days} days.`);
        continue;
      }
      bits.push(`${hits.length} outlet${hits.length === 1 ? "" : "s"} expire within ${days} days:`);
      for (const h of hits) {
        bits.push(
          `· ${h.code} ${h.brand}, ${h.mall} Unit ${h.unit} — ${h.facts.expiration_date} (${h.facts.days_remaining} days), rent ${h.facts.monthly_rent_display}.`,
        );
      }
    }
    if (run.tool === "deposit_at_risk") {
      const hits = run.result as ToolHit[];
      if (!hits.length) {
        bits.push("No sealed deposits currently flagged.");
        continue;
      }
      bits.push(`${hits.length} deposit${hits.length === 1 ? "" : "s"} at risk:`);
      for (const h of hits) {
        bits.push(
          `· ${h.code} ${h.brand} — ${h.facts.security_deposit_display} (${h.facts.reason}).`,
        );
      }
    }
    if (run.tool === "rent_roll") {
      const roll = run.result as {
        monthly_display: string;
        annual_display: string;
        outlets: ToolHit[];
      };
      bits.push(
        `Sealed rent roll is ${roll.monthly_display} / month (${roll.annual_display} annual) across ${roll.outlets.length} trading matters.`,
      );
    }
    if (run.tool === "find_outlet") {
      const hits = run.result as ToolHit[];
      if (!hits.length) {
        bits.push("No matter matched that query.");
        continue;
      }
      for (const h of hits) {
        bits.push(
          `· ${h.code} ${h.brand} at ${h.mall} Unit ${h.unit} (${h.city}) — stage ${h.stage}, rent ${h.facts.monthly_rent_display}, expires ${h.facts.expiration_date ?? "—"}.`,
        );
      }
    }
  }
  bits.push(`Asked: “${message}”`);
  return bits.join("\n");
}
