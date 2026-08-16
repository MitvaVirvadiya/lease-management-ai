import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  jsxFramework: "react",
  outdir: "styled-system",
  theme: {
    extend: {
      tokens: {
        colors: {
          vellum: { value: "#F3EEE6" },
          "vellum.dim": { value: "#E6DFD2" },
          ink: { value: "#1E2430" },
          "ink.deep": { value: "#151A24" },
          "ink.soft": { value: "#2A3242" },
          wax: { value: "#7A1F2B" },
          "wax.deep": { value: "#5C1620" },
          foil: { value: "#C4A574" },
          "foil.dim": { value: "#8E7652" },
          obligation: { value: "#2F3A2E" },
          "obligation.mist": { value: "#3E4C3C" },
        },
        fonts: {
          clause: { value: "var(--font-serif), 'Source Serif 4', Georgia, serif" },
          ops: { value: "var(--font-sans), 'IBM Plex Sans', sans-serif" },
          mono: { value: "var(--font-mono), 'IBM Plex Mono', ui-monospace, monospace" },
        },
      },
    },
  },
});
