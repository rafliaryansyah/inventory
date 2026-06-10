import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        warm: "#F5F1E8",
        ink: "#1A1F2E",
        "ink-soft": "#4A5060",
        "ink-mute": "#7A8090",
        amber: "#B8842B",
        "amber-dk": "#8E6620",
        "amber-sf": "#F5DEBE",
        navy: "#1E3A5F",
        "navy-sf": "#DCE5F0",
        sage: "#5A7A5A",
        "sage-sf": "#D7EAD7",
        rust: "#A02F3E",
        "rust-sf": "#FBE9EC",
        paper: "#FFFFFF",
        line: "#E8E2D4",
        "line-dk": "#D9D2C0",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26,31,46,0.04), 0 2px 8px rgba(26,31,46,0.04)",
        lift: "0 4px 12px rgba(26,31,46,0.08), 0 2px 4px rgba(26,31,46,0.04)",
      },
    },
  },
  plugins: [],
} satisfies Config;
