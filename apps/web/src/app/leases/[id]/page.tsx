"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@ark-ui/react/dialog";
import { Tabs } from "@ark-ui/react/tabs";
import { Portal } from "@ark-ui/react/portal";
import { css } from "styled-system/css";
import { api } from "@/lib/api";
import { formatDate, formatField, inr } from "@/lib/format";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  type LeaseDetail,
  type LeaseField,
} from "@/lib/types";
import { Button, fieldInput } from "@/components/ui/button";
import { WaxSeal } from "@/components/ui/wax-seal";

export default function MatterPage() {
  const params = useParams<{ id: string }>();
  const [lease, setLease] = useState<LeaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [focusKey, setFocusKey] = useState<string | null>("notice_period_days");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [live, setLive] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    api
      .lease(params.id)
      .then((l) => {
        setLease(l);
        const next: Record<string, string> = {};
        for (const f of l.fields) next[f.key] = f.value ?? "";
        setDrafts(next);
      })
      .catch((e: Error) => setError(e.message));
  }, [params.id]);

  const dirty = useMemo(() => {
    if (!lease) return [];
    return lease.fields.filter((f) => (drafts[f.key] ?? "") !== (f.value ?? ""));
  }, [lease, drafts]);

  useEffect(() => {
    if (!dirty.length) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty.length]);

  if (error) {
    return (
      <div>
        <h1 className={css({ fontFamily: "clause", fontSize: "32px" })}>Instrument missing</h1>
        <p>{error}</p>
      </div>
    );
  }
  if (!lease) return <p>Reading the instrument…</p>;

  const pageText = lease.pages[page] ?? "";
  const pageFields = lease.fields.filter((f) => f.sourcePage === page + 1);
  const notice = lease.fields.find((f) => f.key === "notice_period_days");

  async function saveEdits() {
    if (!lease || !dirty.length) return;
    setBusy("save");
    try {
      const next = await api.patchFields(
        lease.id,
        dirty.map((f) => ({ key: f.key, value: drafts[f.key] ?? null })),
      );
      setLease(next);
      setLive("Particulars saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function commit() {
    if (!lease) return;
    if (dirty.length) await saveEdits();
    setBusy("commit");
    try {
      const next = await api.commit(lease.id);
      setLease(next);
      setConfirmOpen(false);
      setLive("Matter sealed. Outlet, schedule, and dates written.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={css({ display: "grid", gap: "18px" })}>
      <header
        className={css({
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "end",
        })}
      >
        <div>
          <p className={css({ fontFamily: "mono", fontSize: "12px", color: "foil" })}>
            {lease.code} · {lease.extractMode === "rules" ? "rules extract" : "Gemini extract"}
            {lease.sourceType === "scan" ? " · scan" : ""}
          </p>
          <h1 className={css({ fontFamily: "clause", fontSize: { base: "28px", md: "36px" }, textWrap: "balance" })}>
            {lease.title}
          </h1>
        </div>
        <div className={css({ display: "flex", gap: "8px", flexWrap: "wrap" })}>
          <Button tone="foil" onClick={saveEdits} disabled={!dirty.length || busy === "save"}>
            {busy === "save" ? "Saving…" : dirty.length ? `Save ${dirty.length} edits` : "Saved"}
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={!!lease.committed}>
            {lease.committed ? "Sealed" : "Seal & commit"}
          </Button>
        </div>
      </header>

      <div aria-live="polite" className={css({ fontSize: "13px", color: "foil", minH: "18px" })}>
        {live}
      </div>

      {notice && notice.value === "60" && !notice.edited && (
        <p
          className={css({
            borderLeft: "3px solid",
            borderColor: "wax",
            pl: "12px",
            color: "vellum",
            fontSize: "14px",
          })}
        >
          Faint seal on notice: the extract read <strong>60 days</strong> from the fit-out clause. Schedule I and
          clause 12.1 say ninety (90). Correct it before you commit.
        </p>
      )}

      <div
        className={css({
          display: "grid",
          gridTemplateColumns: { base: "1fr", xl: "minmax(0, 1.15fr) minmax(320px, 0.85fr)" },
          gap: "18px",
          alignItems: "start",
        })}
      >
        <Vellum
          pages={lease.pages}
          page={page}
          setPage={setPage}
          pageText={pageText}
          stamps={pageFields}
          focusKey={focusKey}
          onFocus={(key, sourcePage) => {
            setFocusKey(key);
            if (sourcePage) setPage(sourcePage - 1);
          }}
        />

        <Tabs.Root defaultValue="fields">
          <Tabs.List
            className={css({
              display: "flex",
              gap: "4px",
              borderBottom: "1px solid rgba(196,165,116,0.25)",
              mb: "12px",
            })}
          >
            {["fields", "schedule", "dates"].map((t) => (
              <Tabs.Trigger
                key={t}
                value={t}
                className={css({
                  px: "12px",
                  py: "8px",
                  color: "foil",
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  _selected: { color: "vellum", borderBottom: "2px solid", borderColor: "wax" },
                })}
              >
                {t === "fields" ? "Particulars" : t === "schedule" ? "Schedule" : "Dates"}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="fields">
            <FieldEditor
              fields={lease.fields}
              drafts={drafts}
              setDrafts={setDrafts}
              focusKey={focusKey}
              setFocusKey={(k) => {
                setFocusKey(k);
                const f = lease.fields.find((x) => x.key === k);
                if (f) setPage(f.sourcePage - 1);
              }}
            />
          </Tabs.Content>
          <Tabs.Content value="schedule">
            <ScheduleTable lease={lease} />
          </Tabs.Content>
          <Tabs.Content value="dates">
            <DatesList lease={lease} />
          </Tabs.Content>
        </Tabs.Root>
      </div>

      <Dialog.Root open={confirmOpen} onOpenChange={(e) => setConfirmOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop className={css({ pos: "fixed", inset: 0, bg: "rgba(21,26,36,0.72)" })} />
          <Dialog.Positioner
            className={css({
              pos: "fixed",
              inset: 0,
              display: "grid",
              placeItems: "center",
              p: "16px",
              overflow: "auto",
            })}
          >
            <Dialog.Content
              className={css({
                bg: "ink",
                border: "1px solid",
                borderColor: "foil",
                p: "24px",
                maxW: "420px",
                overscrollBehavior: "contain",
              })}
            >
              <Dialog.Title className={css({ fontFamily: "clause", fontSize: "24px" })}>
                Seal this extract?
              </Dialog.Title>
              <Dialog.Description className={css({ color: "rgba(243,238,230,0.75)", my: "12px" })}>
                Commit writes the outlet, monthly schedule, obligations, and critical-date alerts. The card stays in
                Review so you can drag it to Active.
              </Dialog.Description>
              <div className={css({ display: "flex", gap: "8px", justifyContent: "flex-end" })}>
                <Dialog.CloseTrigger asChild>
                  <Button tone="ghost">Keep editing</Button>
                </Dialog.CloseTrigger>
                <Button onClick={commit} disabled={busy === "commit"}>
                  {busy === "commit" ? "Sealing…" : "Seal & commit"}
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </div>
  );
}

function Vellum({
  pages,
  page,
  setPage,
  pageText,
  stamps,
  focusKey,
  onFocus,
}: {
  pages: string[];
  page: number;
  setPage: (n: number) => void;
  pageText: string;
  stamps: LeaseField[];
  focusKey: string | null;
  onFocus: (key: string, sourcePage: number) => void;
}) {
  return (
    <section>
      <div className={css({ display: "flex", justifyContent: "space-between", mb: "8px", alignItems: "center" })}>
        <p className={css({ fontSize: "12px", color: "foil", letterSpacing: "0.12em" })}>
          INSTRUMENT · PAGE {page + 1} OF {pages.length}
        </p>
        <div className={css({ display: "flex", gap: "6px" })}>
          <Button tone="foil" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous folio
          </Button>
          <Button tone="foil" size="sm" disabled={page >= pages.length - 1} onClick={() => setPage(page + 1)}>
            Next folio
          </Button>
        </div>
      </div>
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: { base: "1fr", md: "1fr 168px" },
          bg: "vellum",
          color: "ink",
          minH: "640px",
          boxShadow: "0 24px 50px rgba(0,0,0,0.35)",
          position: "relative",
        })}
      >
        <article
          className={css({
            p: { base: "28px", md: "40px" },
            fontFamily: "clause",
            fontSize: "16px",
            lineHeight: "1.55",
            borderLeft: "8px solid",
            borderColor: "wax",
            whiteSpace: "pre-wrap",
          })}
        >
          {highlight(pageText, stamps, focusKey)}
        </article>
        <aside
          className={css({
            borderLeft: "1px dashed rgba(122,31,43,0.25)",
            p: "12px",
            display: "grid",
            alignContent: "start",
            gap: "10px",
            bg: "rgba(243,238,230,0.55)",
          })}
        >
          <p className={css({ fontSize: "10px", letterSpacing: "0.16em", color: "wax" })}>WAX PINS</p>
          {stamps.length === 0 && (
            <p className={css({ fontSize: "12px", color: "ink", fontFamily: "ops" })}>No pins on this folio.</p>
          )}
          {stamps.slice(0, 8).map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onFocus(s.key, s.sourcePage)}
              className={css({
                display: "grid",
                gridTemplateColumns: "28px 1fr",
                gap: "6px",
                textAlign: "left",
                bg: "transparent",
                border: "none",
                cursor: "pointer",
                color: "ink",
              })}
            >
              <WaxSeal label={s.confidence >= 0.8 ? "OK" : "?"} size={28} faint={s.confidence < 0.75} />
              <span>
                <span className={css({ display: "block", fontSize: "10px", letterSpacing: "0.08em" })}>
                  {s.label}
                </span>
                <span className={css({ display: "block", fontFamily: "ops", fontSize: "12px", fontWeight: "600" })}>
                  {formatField(s.value, s.valueType)}
                </span>
              </span>
            </button>
          ))}
        </aside>
      </div>
    </section>
  );
}

function highlight(text: string, stamps: LeaseField[], focusKey: string | null) {
  const phrase = stamps.find((s) => s.key === focusKey)?.sourcePhrase;
  if (!phrase || !text.toLowerCase().includes(phrase.toLowerCase())) {
    return text;
  }
  const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
  const before = text.slice(0, idx);
  const hit = text.slice(idx, idx + phrase.length);
  const after = text.slice(idx + phrase.length);
  return (
    <>
      {before}
      <mark
        className={css({
          bg: "rgba(122,31,43,0.14)",
          color: "ink",
          boxShadow: "inset 0 -2px 0 #7A1F2B",
        })}
      >
        {hit}
      </mark>
      {after}
    </>
  );
}

function FieldEditor({
  fields,
  drafts,
  setDrafts,
  focusKey,
  setFocusKey,
}: {
  fields: LeaseField[];
  drafts: Record<string, string>;
  setDrafts: (d: Record<string, string>) => void;
  focusKey: string | null;
  setFocusKey: (k: string) => void;
}) {
  return (
    <div className={css({ display: "grid", gap: "18px", maxH: "720px", overflowY: "auto", pr: "4px" })}>
      {CATEGORY_ORDER.map((cat) => {
        const rows = fields.filter((f) => f.category === cat);
        if (!rows.length) return null;
        return (
          <section key={cat}>
            <h3
              className={css({
                fontFamily: "clause",
                fontSize: "16px",
                borderBottom: "1px solid rgba(196,165,116,0.25)",
                mb: "8px",
              })}
            >
              {CATEGORY_LABEL[cat] ?? cat}
            </h3>
            <div className={css({ display: "grid", gap: "8px" })}>
              {rows.map((f) => (
                <label
                  key={f.key}
                  htmlFor={f.key}
                  className={css({
                    display: "grid",
                    gap: "4px",
                    p: "8px",
                    bg: focusKey === f.key ? "rgba(122,31,43,0.18)" : "transparent",
                    borderLeft: focusKey === f.key ? "3px solid" : "3px solid transparent",
                    borderColor: "wax",
                  })}
                >
                  <span className={css({ display: "flex", justifyContent: "space-between", gap: "8px" })}>
                    <span className={css({ fontSize: "12px" })}>
                      {f.label}
                      {f.required ? " *" : ""}
                    </span>
                    <span className={css({ fontFamily: "mono", fontSize: "10px", color: "foil" })}>
                      p.{f.sourcePage} · {Math.round(f.confidence * 100)}%
                      {f.edited ? " · edited" : ""}
                    </span>
                  </span>
                  <input
                    id={f.key}
                    name={f.key}
                    autoComplete="off"
                    spellCheck={false}
                    className={fieldInput}
                    value={drafts[f.key] ?? ""}
                    onFocus={() => setFocusKey(f.key)}
                    onChange={(e) => setDrafts({ ...drafts, [f.key]: e.target.value })}
                    placeholder="Blank…"
                  />
                </label>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ScheduleTable({ lease }: { lease: LeaseDetail }) {
  if (!lease.committed) {
    return (
      <p className={css({ color: "foil", fontFamily: "clause" })}>
        Seal the extract to write the monthly schedule. Nothing is posted until you commit.
      </p>
    );
  }
  const upcoming = lease.schedule.filter((r) => r.status === "due" || r.status === "scheduled" || r.status === "free");
  const show = upcoming.slice(0, 14);
  return (
    <div>
      <p className={css({ mb: "8px", fontSize: "13px" })}>
        Outlet {lease.outlet?.code} · {lease.outlet?.areaSqft.toLocaleString("en-IN")} sq ft
      </p>
      <table className={css({ width: "100%", fontSize: "13px", fontVariantNumeric: "tabular-nums" })}>
        <thead>
          <tr className={css({ color: "foil", textAlign: "left" })}>
            <th>Period</th>
            <th>Rent</th>
            <th>CAM+</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {show.map((r) => (
            <tr key={r.id} className={css({ borderTop: "1px solid rgba(196,165,116,0.14)" })}>
              <td className={css({ py: "6px" })}>
                {formatDate(r.periodStart)}
                <span className={css({ color: "foil", display: "block", fontSize: "11px" })}>{r.status}</span>
              </td>
              <td>{inr(r.rentAmount)}</td>
              <td>{inr(r.camAmount + r.otherAmount)}</td>
              <td>{inr(r.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {lease.obligations.length > 0 && (
        <ul className={css({ mt: "16px", fontSize: "13px", color: "rgba(243,238,230,0.8)" })}>
          {lease.obligations.map((o) => (
            <li key={o.id}>
              {o.title} — {o.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DatesList({ lease }: { lease: LeaseDetail }) {
  if (!lease.committed) {
    return (
      <p className={css({ color: "foil", fontFamily: "clause" })}>
        Critical dates (expiry, option window, deposit, escalation) are struck when you seal.
      </p>
    );
  }
  if (!lease.alerts.length) return <p>No dates on this matter.</p>;
  return (
    <ul className={css({ listStyle: "none", display: "grid", gap: "10px" })}>
      {lease.alerts.map((a) => (
        <li key={a.id} className={css({ borderLeft: "3px solid", borderColor: a.severity === "critical" ? "wax" : "foil", pl: "10px" })}>
          <p className={css({ fontSize: "11px", color: "foil", letterSpacing: "0.12em" })}>
            {a.type.replace("_", " ")} · {formatDate(a.dueDate)}
          </p>
          <p className={css({ fontFamily: "clause" })}>{a.title}</p>
          <p className={css({ fontSize: "13px", color: "rgba(243,238,230,0.75)" })}>{a.body}</p>
        </li>
      ))}
      <li>
        <Link href="/pipeline" className={css({ color: "foil" })}>
          Drag this matter to Active on the pipeline →
        </Link>
      </li>
    </ul>
  );
}
