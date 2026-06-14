export const CHART_PALETTE = [
  "#4F86C6", // amber (brand biru)
  "#1E3A5F", // navy
  "#5A7A5A", // sage
  "#A02F3E", // rust
  "#2F5C9E", // amber-dk (brand biru tua)
  "#4A5060", // ink-soft
  "#7A8090", // ink-mute
  "#C6D4E6", // line-dk
];

export type DonutDatum = { label: string; value: number };

/** Donut chart with built-in legend (PLAN §8.3 "Distribusi per Kategori"). */
export function DonutChart({
  data,
  size = 184,
  thickness = 26,
  centerLabel = "total",
}: {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#DCE6F1"
            strokeWidth={thickness}
          />
          {total > 0 &&
            data.map((d, i) => {
              const frac = d.value / total;
              const len = frac * c;
              const seg = (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
                  strokeWidth={thickness}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return seg;
            })}
        </g>
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-ink font-serif"
          style={{ fontSize: 26, fontWeight: 500 }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          className="fill-ink-mute"
          style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}
        >
          {centerLabel}
        </text>
      </svg>

      <ul className="flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-ink-soft">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }}
              />
              {d.label}
            </span>
            <span className="font-mono text-xs font-medium text-ink">
              {d.value}
            </span>
          </li>
        ))}
        {data.length === 0 && (
          <li className="text-sm text-ink-mute">Belum ada data.</li>
        )}
      </ul>
    </div>
  );
}
