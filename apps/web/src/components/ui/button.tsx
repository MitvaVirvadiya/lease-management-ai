"use client";

import { css, cva, cx } from "styled-system/css";

const recipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "ops",
    fontWeight: "500",
    letterSpacing: "0.02em",
    cursor: "pointer",
    borderWidth: "1px",
    borderStyle: "solid",
    transitionProperty: "background-color, border-color, color, transform",
    transitionDuration: "160ms",
    _disabled: { opacity: 0.5, cursor: "not-allowed" },
    _hover: { transform: "translateY(-1px)" },
  },
  variants: {
    tone: {
      wax: {
        bg: "wax",
        color: "vellum",
        borderColor: "wax.deep",
        _hover: { bg: "wax.deep" },
      },
      foil: {
        bg: "transparent",
        color: "foil",
        borderColor: "foil",
        _hover: { bg: "rgba(196,165,116,0.12)" },
      },
      ghost: {
        bg: "transparent",
        color: "vellum",
        borderColor: "transparent",
        _hover: { bg: "ink.soft" },
      },
      vellum: {
        bg: "vellum",
        color: "ink",
        borderColor: "vellum.dim",
        _hover: { bg: "vellum.dim" },
      },
    },
    size: {
      sm: { px: "10px", py: "6px", fontSize: "12px" },
      md: { px: "14px", py: "9px", fontSize: "13px" },
    },
  },
  defaultVariants: { tone: "wax", size: "md" },
});

export function Button({
  tone,
  size,
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "wax" | "foil" | "ghost" | "vellum";
  size?: "sm" | "md";
}) {
  return <button type={type} className={cx(recipe({ tone, size }), className)} {...props} />;
}

export const fieldInput = css({
  width: "100%",
  bg: "ink.deep",
  color: "vellum",
  borderWidth: "1px",
  borderColor: "rgba(196,165,116,0.35)",
  px: "10px",
  py: "8px",
  fontFamily: "ops",
  fontSize: "13px",
  _focus: { borderColor: "foil" },
});
