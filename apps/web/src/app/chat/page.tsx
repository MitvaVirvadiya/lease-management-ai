"use client";

import Link from "next/link";
import { useState } from "react";
import { css } from "styled-system/css";
import { api } from "@/lib/api";
import type { ChatThread } from "@/lib/types";
import { Button, fieldInput } from "@/components/ui/button";

const SUGGESTIONS = [
  "Which outlets escalate in 90 days?",
  "Which leases expire in 180 days?",
  "Which deposits are at risk?",
  "What is the sealed rent roll?",
];

export default function ChatPage() {
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const next = await api.chat(q, thread?.id);
      setThread(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={css({ maxW: "760px", mx: "auto" })}>
      <h1 className={css({ fontFamily: "clause", fontSize: "32px", mb: "6px" })}>Portfolio counsel</h1>
      <p className={css({ color: "foil", mb: "18px" })}>
        Ask in English. Numbers come from blotter tools — the model cannot invent rent.
      </p>

      {!thread && (
        <div className={css({ display: "grid", gap: "8px", mb: "20px" })}>
          {SUGGESTIONS.map((s) => (
            <Button key={s} tone="foil" onClick={() => send(s)} disabled={busy}>
              {s}
            </Button>
          ))}
        </div>
      )}

      <div className={css({ display: "grid", gap: "14px", mb: "20px" })}>
        {thread?.messages?.map((m) => (
          <article
            key={m.id}
            className={css({
              borderLeft: "3px solid",
              borderColor: m.role === "user" ? "foil" : "wax",
              pl: "12px",
            })}
          >
            <p className={css({ fontSize: "11px", letterSpacing: "0.14em", color: "foil" })}>
              {m.role === "user" ? "YOU" : "COUNSEL"}
            </p>
            <pre
              className={css({
                whiteSpace: "pre-wrap",
                fontFamily: m.role === "assistant" ? "clause" : "ops",
                fontSize: "16px",
                lineHeight: "1.5",
              })}
            >
              {m.content}
            </pre>
            {m.citations && m.citations.length > 0 && (
              <p className={css({ mt: "8px", display: "flex", gap: "6px", flexWrap: "wrap" })}>
                {m.citations.map((c) => (
                  <span
                    key={c}
                    translate="no"
                    className={css({
                      fontFamily: "mono",
                      fontSize: "11px",
                      color: "ink",
                      bg: "foil",
                      px: "6px",
                      py: "2px",
                    })}
                  >
                    {c}
                  </span>
                ))}
              </p>
            )}
          </article>
        ))}
      </div>

      {error && (
        <p role="alert" className={css({ color: "wax", mb: "8px" })}>
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(message);
        }}
        className={css({ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" })}
      >
        <label
          htmlFor="counsel-q"
          className={css({
            position: "absolute",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
          })}
        >
          Ask counsel
        </label>
        <input
          id="counsel-q"
          name="message"
          autoComplete="off"
          className={fieldInput}
          placeholder="Which outlets escalate in 90 days?…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type="submit" disabled={busy || !message.trim()}>
          {busy ? "Consulting…" : "Ask"}
        </Button>
      </form>
      <p className={css({ mt: "16px", fontSize: "13px" })}>
        <Link href="/pipeline" className={css({ color: "foil" })}>
          After you seal Unit 214, drag the card to Active.
        </Link>
      </p>
    </div>
  );
}
