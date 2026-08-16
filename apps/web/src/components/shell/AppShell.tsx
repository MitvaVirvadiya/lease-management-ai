"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { css, cx } from "styled-system/css";
import { WaxSeal } from "@/components/ui/wax-seal";

const NAV = [
  { href: "/", label: "Blotter" },
  { href: "/pipeline", label: "Matters" },
  { href: "/leases", label: "Docket" },
  { href: "/alerts", label: "Dates" },
  { href: "/chat", label: "Counsel" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <div
      className={css({
        minH: "100dvh",
        bg: "ink",
        color: "vellum",
        backgroundImage:
          "radial-gradient(1200px 500px at 10% -10%, rgba(196,165,116,0.08), transparent), linear-gradient(180deg, #1E2430 0%, #171C26 100%)",
      })}
    >
      <header
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "16px",
          px: "20px",
          py: "12px",
          borderBottom: "1px solid rgba(196,165,116,0.28)",
          position: "sticky",
          top: 0,
          zIndex: 20,
          bg: "rgba(30,36,48,0.92)",
          backdropFilter: "blur(10px)",
        })}
      >
        <Link
          href="/"
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "vellum",
            textDecoration: "none",
          })}
        >
          <WaxSeal label="N★" size={32} />
          <span>
            <span
              className={css({
                display: "block",
                fontFamily: "clause",
                fontSize: "18px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              })}
            >
              Lease OS
            </span>
            <span
              className={css({
                display: "block",
                fontSize: "11px",
                color: "foil",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              })}
            >
              Northstar counsel
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className={css({
            display: "flex",
            gap: "4px",
            ml: "auto",
            overflowX: "auto",
            minW: 0,
          })}
        >
          {NAV.map((item) => {
            const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  css({
                    px: "12px",
                    py: "8px",
                    fontSize: "13px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    color: "foil",
                    borderBottom: "2px solid transparent",
                    whiteSpace: "nowrap",
                  }),
                  active &&
                    css({
                      color: "vellum",
                      borderColor: "wax",
                    }),
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {offline && (
        <div
          role="status"
          aria-live="polite"
          className={css({
            bg: "wax",
            color: "vellum",
            textAlign: "center",
            py: "8px",
            fontSize: "13px",
          })}
        >
          You are offline. The blotter will not refresh until the line returns.
        </div>
      )}

      <main id="main" className={css({ px: { base: "16px", md: "28px" }, py: "24px" })}>
        {children}
      </main>
    </div>
  );
}
