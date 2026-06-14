export type LineDatum = { label: string; value: number };

/** Approval-rate trend line chart (values 0–100). */
export function LineChart({
  data,
  max = 100,
}: {
  data: LineDatum[];
  max?: number;
}) {
  const W = 320;
  const H = 180;
  const padX = 8;
  const padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const n = data.length;

  const x = (i: number) => padX + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padY + innerH - (Math.min(v, max) / max) * innerH;

  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const areaPath =
    n > 0
      ? `M ${x(0)},${padY + innerH} L ${points
          .split(" ")
          .join(" L ")} L ${x(n - 1)},${padY + innerH} Z`
      : "";

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        preserveAspectRatio="none"
        style={{ height: H }}
      >
        {/* gridlines */}
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line
              x1={padX}
              x2={W - padX}
              y1={y(g)}
              y2={y(g)}
              stroke="#DCE6F1"
              strokeWidth={1}
            />
            <text x={0} y={y(g) - 2} className="fill-ink-mute" style={{ fontSize: 8 }}>
              {g}
            </text>
          </g>
        ))}

        {n > 0 && (
          <>
            <path d={areaPath} fill="#4F86C6" opacity={0.08} />
            <polyline
              points={points}
              fill="none"
              stroke="#4F86C6"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {data.map((d, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(d.value)}
                r={2.5}
                fill="#4F86C6"
              >
                <title>{`${d.label}: ${d.value}%`}</title>
              </circle>
            ))}
          </>
        )}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10px] text-ink-mute">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
