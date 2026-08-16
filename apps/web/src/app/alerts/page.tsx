"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { css } from "styled-system/css";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AlertItem } from "@/lib/types";

export default function AlertsPage() {
  const [rows, setRows] = useState<AlertItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.alerts().then(setRows).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p>{error}</p>;
  if (!rows) return <p>Pulling critical dates…</p>;

  return (
    <div className={css({ maxW: "880px" })}>
      <h1 className={css({ fontFamily: "clause", fontSize: "32px", mb: "8px" })}>Critical dates</h1>
      <p className={css({ color: "foil", mb: "20px" })}>
        Expiry, option windows, escalations, and thin deposits — struck from sealed matters only.
      </p>
      {rows.length === 0 && <p>No dates. Commit a lease to generate them.</p>}
      <ol className={css({ listStyle: "none" })}>
        {rows.map((a, i) => (
          <li
            key={a.id}
            className={css({
              display: "grid",
              gridTemplateColumns: { base: "1fr", md: "40px 100px 1fr 120px" },
              gap: "10px",
              py: "14px",
              borderBottom: "1px solid rgba(196,165,116,0.16)",
            })}
          >
            <span className={css({ fontFamily: "mono", color: "foil", fontSize: "12px" })}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={css({
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: a.severity === "critical" ? "wax" : "foil",
              })}
            >
              {a.type.replace("_", " ")}
            </span>
            <div className={css({ minW: 0 })}>
              <Link href={`/leases/${a.leaseId}`} className={css({ color: "vellum", fontFamily: "clause" })}>
                {a.title}
              </Link>
              <p className={css({ fontSize: "13px", color: "rgba(243,238,230,0.7)" })}>{a.body}</p>
            </div>
            <span className={css({ fontVariantNumeric: "tabular-nums", fontFamily: "mono", fontSize: "12px" })}>
              {formatDate(a.dueDate)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
