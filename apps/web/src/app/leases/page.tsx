"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileUpload } from "@ark-ui/react/file-upload";
import { css } from "styled-system/css";
import { api } from "@/lib/api";
import { formatDate, inr } from "@/lib/format";
import type { LeaseListItem, SampleItem } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function DocketPage() {
  const router = useRouter();
  const [leases, setLeases] = useState<LeaseListItem[] | null>(null);
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.leases().then(setLeases).catch((e: Error) => setError(e.message));
    api.samples().then(setSamples).catch(() => undefined);
  }, []);

  async function load(slug: string) {
    setBusy(slug);
    setError(null);
    try {
      const lease = await api.loadSample(slug);
      router.push(`/leases/${lease.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function onFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setBusy("upload");
    setError(null);
    try {
      const lease = await api.upload(file);
      router.push(`/leases/${lease.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={css({ display: "grid", gap: "24px", gridTemplateColumns: { base: "1fr", lg: "280px 1fr" } })}>
      <aside>
        <h1 className={css({ fontFamily: "clause", fontSize: "28px", mb: "8px" })}>Docket</h1>
        <p className={css({ fontSize: "13px", color: "foil", mb: "16px" })}>
          Load Phoenix Marketcity Unit 214, or drop another instrument.
        </p>
        <FileUpload.Root
          maxFiles={1}
          accept=".pdf,.txt,.html,application/pdf,text/plain"
          onFileAccept={(d) => onFiles(d.files)}
        >
          <FileUpload.Dropzone
            className={css({
              border: "1px dashed rgba(196,165,116,0.5)",
              p: "16px",
              fontSize: "13px",
              color: "foil",
              mb: "16px",
              cursor: "pointer",
            })}
          >
            Drop a PDF or text lease…
            <FileUpload.HiddenInput />
          </FileUpload.Dropzone>
        </FileUpload.Root>
        <ul className={css({ listStyle: "none", display: "grid", gap: "6px" })}>
          {samples.map((s) => (
            <li key={s.slug}>
              <Button
                tone={s.highlight ? "wax" : "foil"}
                size="sm"
                disabled={busy === s.slug}
                onClick={() => load(s.slug)}
                className={css({ width: "100%", justifyContent: "flex-start" })}
              >
                {busy === s.slug ? "Reading…" : s.highlight ? "Phoenix Unit 214" : `${s.mall} ${s.unit}`}
              </Button>
            </li>
          ))}
        </ul>
      </aside>

      <section>
        {error && (
          <p role="alert" className={css({ color: "wax", mb: "12px" })}>
            {error}
          </p>
        )}
        {!leases && <p>Opening the docket…</p>}
        {leases && leases.length === 0 && (
          <p>No matters on the blotter. Load a sample lease or upload a PDF.</p>
        )}
        {leases && leases.length > 0 && (
          <table className={css({ width: "100%", borderCollapse: "collapse", fontSize: "14px" })}>
            <thead>
              <tr className={css({ textAlign: "left", color: "foil", fontSize: "11px", letterSpacing: "0.12em" })}>
                <th className={css({ py: "8px" })}>Code</th>
                <th>Matter</th>
                <th>Stage</th>
                <th>Rent</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {leases.map((l) => (
                <tr key={l.id} className={css({ borderTop: "1px solid rgba(196,165,116,0.16)" })}>
                  <td className={css({ py: "10px", fontFamily: "mono", fontSize: "12px" })}>
                    <Link href={`/leases/${l.id}`} className={css({ color: "foil" })}>
                      {l.code}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/leases/${l.id}`} className={css({ color: "vellum" })}>
                      {l.brand} · {l.mall} {l.unit}
                    </Link>
                  </td>
                  <td className={css({ textTransform: "capitalize" })}>
                    {l.stage}
                    {l.committed ? " · sealed" : ""}
                  </td>
                  <td className={css({ fontVariantNumeric: "tabular-nums" })}>
                    {l.monthlyRent ? inr(l.monthlyRent) : "—"}
                  </td>
                  <td className={css({ fontVariantNumeric: "tabular-nums" })}>{formatDate(l.expirationDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
