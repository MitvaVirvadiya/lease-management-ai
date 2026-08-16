"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { css } from "styled-system/css";
import { api } from "@/lib/api";
import { formatDate, inr } from "@/lib/format";
import type { Dashboard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { WaxSeal } from "@/components/ui/wax-seal";

export default function BlotterPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Empty
        title="The blotter is dark"
        body={`${error} Start Postgres and the API, then refresh.`}
      />
    );
  }
  if (!data) return <Empty title="Reading the blotter…" body="Pulling sealed rent and cause list." />;

  const hero = data.awaitingSeal[0];

  return (
    <div className={css({ maxW: "1100px", mx: "auto" })}>
      <p
        className={css({
          fontSize: "11px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "foil",
          mb: "10px",
        })}
      >
        Northstar Retail · matter blotter · {formatDate(data.asOf)}
      </p>

      <h1
        className={css({
          fontFamily: "clause",
          fontSize: { base: "34px", md: "52px" },
          lineHeight: "1.15",
          textWrap: "balance",
          maxW: "18ch",
          mb: "18px",
        })}
      >
        {inr(data.monthlyRent)}{" "}
        <span className={css({ color: "foil", fontSize: "0.55em" })}>a month is sealed and trading.</span>
      </h1>

      <p className={css({ color: "rgba(243,238,230,0.72)", maxW: "62ch", mb: "28px" })}>
        {data.sealedCount} outlets on the demise · {inr(data.annualRent)} annualised ·{" "}
        {data.criticalAlertCount} critical dates. Counsel seals the extract before anything hits the rent roll.
      </p>

      {hero && (
        <section
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "auto 1fr auto" },
            gap: "16px",
            alignItems: "center",
            border: "1px solid rgba(196,165,116,0.35)",
            p: "18px",
            mb: "32px",
            bg: "ink.deep",
          })}
        >
          <WaxSeal label="WAIT" size={56} />
          <div className={css({ minW: 0 })}>
            <p className={css({ fontSize: "11px", color: "foil", letterSpacing: "0.14em" })}>
              AWAITING YOUR SEAL
            </p>
            <p className={css({ fontFamily: "clause", fontSize: "24px" })}>{hero.title}</p>
            <p className={css({ color: "rgba(243,238,230,0.7)", fontSize: "14px" })}>
              Notice was pulled at 60 days with a faint seal — the instrument says ninety. Fix it, then commit.
            </p>
          </div>
          <Link href={`/leases/${hero.id}`}>
            <Button>Open Unit {hero.unit}</Button>
          </Link>
        </section>
      )}

      <section>
        <h2
          className={css({
            fontFamily: "clause",
            fontSize: "22px",
            mb: "12px",
            borderBottom: "1px solid rgba(196,165,116,0.28)",
            pb: "8px",
          })}
        >
          Cause list
        </h2>
        {data.causeList.length === 0 ? (
          <p>No open dates. Load a sample if the seed has not run.</p>
        ) : (
          <ol className={css({ listStyle: "none", display: "grid", gap: "0" })}>
            {data.causeList.map((row, i) => (
              <li
                key={row.id}
                className={css({
                  display: "grid",
                  gridTemplateColumns: { base: "1fr", md: "48px 110px 1fr 120px" },
                  gap: "10px",
                  alignItems: "baseline",
                  py: "12px",
                  borderBottom: "1px solid rgba(196,165,116,0.14)",
                  fontVariantNumeric: "tabular-nums",
                })}
              >
                <span className={css({ fontFamily: "mono", fontSize: "12px", color: "foil" })}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={css({
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: row.severity === "critical" ? "wax" : "foil",
                  })}
                >
                  {row.type.replace("_", " ")}
                </span>
                <Link href={`/leases/${row.leaseId}`} className={css({ color: "vellum" })}>
                  {row.title}
                </Link>
                <span className={css({ fontFamily: "mono", fontSize: "12px" })}>{formatDate(row.dueDate)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className={css({ mt: "28px", fontSize: "13px", color: "foil" })}>
        {data.byStage.map((s) => `${s.name} ${s.count}`).join("  ·  ")}
      </p>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className={css({ maxW: "640px" })}>
      <h1 className={css({ fontFamily: "clause", fontSize: "36px", mb: "8px" })}>{title}</h1>
      <p className={css({ color: "rgba(243,238,230,0.7)" })}>{body}</p>
    </div>
  );
}
