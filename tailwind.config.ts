import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tema Handal — biru muda. Nama token `amber*` dipertahankan sebagai
        // warna brand agar tidak perlu mengubah 48+ pemakaian; nilainya biru.
        warm: "#EEF3FB",
        ink: "#1A1F2E",
        "ink-soft": "#4A5060",
        "ink-mute": "#7A8090",
        amber: "#4F86C6",
        "amber-dk": "#2F5C9E",
        "amber-sf": "#DCEAF8",
        navy: "#1E3A5F",
        "navy-sf": "#DCE5F0",
        sage: "#5A7A5A",
        "sage-sf": "#D7EAD7",
        rust: "#A02F3E",
        "rust-sf": "#FBE9EC",
        paper: "#FFFFFF",
        line: "#DCE6F1",
        "line-dk": "#C6D4E6",
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
