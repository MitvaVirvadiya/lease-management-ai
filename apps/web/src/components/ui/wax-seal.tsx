import { css } from "styled-system/css";

export function WaxSeal({
  label = "OS",
  size = 36,
  faint = false,
}: {
  label?: string;
  size?: number;
  faint?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={css({
        display: "inline-grid",
        placeItems: "center",
        borderRadius: "999px",
        bg: "wax",
        color: "foil",
        borderWidth: "2px",
        borderColor: "foil",
        fontFamily: "clause",
        fontWeight: "600",
        letterSpacing: "0.08em",
        boxShadow: "inset 0 1px 0 rgba(243,238,230,0.18), 0 2px 0 rgba(0,0,0,0.35)",
        flexShrink: 0,
        userSelect: "none",
      })}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.28,
        opacity: faint ? 0.55 : 1,
      }}
    >
      {label}
    </span>
  );
}
