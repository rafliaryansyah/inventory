import { cn } from "@/lib/utils";

// Deterministic pseudo-random bits from a string (FNV-1a + xorshift).
function bitsFrom(text: string, n: number): boolean[] {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const bits: boolean[] = [];
  for (let i = 0; i < n; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    bits.push((h & 1) === 1);
  }
  return bits;
}

/**
 * Decorative QR-style glyph derived from a value (e.g. asset code).
 * Not a scannable QR — a stylised placeholder per PLAN (§8.2 "QR glyph SVG kecil").
 */
export function QrGlyph({
  value,
  size = 40,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const grid = 11;
  const bits = bitsFrom(value, grid * grid);
  const c = size / grid;

  const inFinder = (x: number, y: number) => {
    const f = (ox: number, oy: number) =>
      x >= ox && x < ox + 3 && y >= oy && y < oy + 3;
    return f(0, 0) || f(grid - 3, 0) || f(0, grid - 3);
  };

  const rects: React.ReactNode[] = [];
  for (let i = 0; i < bits.length; i++) {
    const x = i % grid;
    const y = Math.floor(i / grid);
    if (inFinder(x, y)) continue;
    if (bits[i]) {
      rects.push(
        <rect key={i} x={x * c} y={y * c} width={c} height={c} fill="currentColor" />,
      );
    }
  }

  const finder = (ox: number, oy: number, key: string) => (
    <g key={key}>
      <rect x={ox * c} y={oy * c} width={c * 3} height={c * 3} fill="currentColor" />
      <rect
        x={(ox + 0.5) * c}
        y={(oy + 0.5) * c}
        width={c * 2}
        height={c * 2}
        fill="var(--qr-bg, #fff)"
      />
      <rect x={(ox + 1) * c} y={(oy + 1) * c} width={c} height={c} fill="currentColor" />
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("text-ink", className)}
      role="img"
      aria-label={`QR ${value}`}
    >
      {rects}
      {finder(0, 0, "tl")}
      {finder(grid - 3, 0, "tr")}
      {finder(0, grid - 3, "bl")}
    </svg>
  );
}
