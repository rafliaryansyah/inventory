// Format helpers — currency (Rupiah), dates, greeting. (PLAN §5.7)

type Num = number | string | { toString(): string };

function num(n: Num): number {
  if (typeof n === "number") return n;
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

/** "Rp 1.450.000" */
export function rp(n: Num): string {
  return "Rp " + Math.round(num(n)).toLocaleString("id-ID");
}

function trim1(x: number): string {
  const r = Math.round(x * 10) / 10;
  return r.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

/** "Rp 1,5 Jt" / "Rp 14,5 M" / "Rp 850 rb" */
export function rpShort(n: Num): string {
  const v = num(n);
  const abs = Math.abs(v);
  if (abs >= 1e9) return `Rp ${trim1(v / 1e9)} M`;
  if (abs >= 1e6) return `Rp ${trim1(v / 1e6)} Jt`;
  if (abs >= 1e3) return `Rp ${trim1(v / 1e3)} rb`;
  return `Rp ${Math.round(v).toLocaleString("id-ID")}`;
}

/** "Jumat, 6 Juni 2026" */
export function formatDateLong(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "06 Jun 2026" */
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "06 Jun 2026, 14:30" */
export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return (
    date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}

/** Time-aware Indonesian greeting. */
export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

/** "Juni" — current month name in Indonesian. */
export function monthName(d: Date = new Date()): string {
  return d.toLocaleDateString("id-ID", { month: "long" });
}

/** Initials for avatar, e.g. "Budi Aryanto" → "BA". */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
