"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { css } from "styled-system/css";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import type { PipelineColumn } from "@/lib/types";
import { WaxSeal } from "@/components/ui/wax-seal";

export default function PipelinePage() {
  const [cols, setCols] = useState<PipelineColumn[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const load = () =>
    api
      .pipeline()
      .then(setCols)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function drop(stage: string) {
    if (!dragging) return;
    await api.setStage(dragging, stage);
    setDragging(null);
    load();
  }

  if (error) return <p>{error}</p>;
  if (!cols) return <p>Laying out the matter pipeline…</p>;

  return (
    <div>
      <h1 className={css({ fontFamily: "clause", fontSize: "32px", mb: "6px" })}>Matter pipeline</h1>
      <p className={css({ color: "foil", mb: "18px", fontSize: "14px" })}>
        Drag a folder onto a stage. This is a counsel docket, not a board of stickies.
      </p>
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: { base: "minmax(240px, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(6, minmax(180px, 1fr))" },
          gap: "10px",
          overflowX: "auto",
        })}
      >
        {cols.map((col) => (
          <section
            key={col.slug}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(col.slug)}
            className={css({
              border: "1px solid rgba(196,165,116,0.22)",
              bg: "ink.deep",
              minH: "420px",
              p: "10px",
            })}
          >
            <header className={css({ display: "flex", alignItems: "center", gap: "8px", mb: "10px" })}>
              <WaxSeal label={String(col.sortOrder)} size={28} />
              <div>
                <h2 className={css({ fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase" })}>
                  {col.name}
                </h2>
                <p className={css({ fontSize: "11px", color: "foil" })}>{col.brief}</p>
              </div>
            </header>
            <div className={css({ display: "grid", gap: "8px" })}>
              {col.leases.map((lease) => (
                <article
                  key={lease.id}
                  draggable
                  onDragStart={() => setDragging(lease.id)}
                  className={css({
                    border: "1px solid rgba(196,165,116,0.28)",
                    p: "10px",
                    bg: "ink.soft",
                    cursor: "grab",
                    _active: { cursor: "grabbing" },
                    userSelect: "none",
                  })}
                >
                  <p className={css({ fontFamily: "mono", fontSize: "11px", color: "foil" })}>{lease.code}</p>
                  <Link href={`/leases/${lease.id}`} className={css({ color: "vellum", fontFamily: "clause" })}>
                    {lease.brand}
                  </Link>
                  <p className={css({ fontSize: "12px", color: "rgba(243,238,230,0.7)" })}>
                    {lease.mall} · {lease.unit}
                  </p>
                  <p className={css({ fontSize: "12px", fontVariantNumeric: "tabular-nums" })}>
                    {lease.monthlyRent ? inr(lease.monthlyRent) : "Unsealed"}
                    {lease.committed ? " · sealed" : ""}
                  </p>
                </article>
              ))}
              {col.leases.length === 0 && (
                <p className={css({ fontSize: "12px", color: "foil.dim", fontFamily: "clause" })}>Empty stage.</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
