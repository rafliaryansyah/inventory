import { cn } from "@/lib/utils";

export type BarDatum = { label: string; approved: number; rejected: number };

/** Stacked monthly volume bar chart (approved = sage, rejected = rust). */
export function BarChart({
  data,
  height = 220,
  className,
}: {
  data: BarDatum[];
  height?: number;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.approved + d.rejected));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const total = d.approved + d.rejected;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-col justify-end" style={{ height: "100%" }}>
                {d.rejected > 0 && (
                  <div
                    className="w-full rounded-t-sm bg-rust transition-all"
                    style={{ height: `${(d.rejected / max) * 100}%` }}
                    title={`${d.label}: ${d.rejected} ditolak`}
                  />
                )}
                <div
                  className={cn(
                    "w-full bg-sage transition-all",
                    d.rejected === 0 && "rounded-t-sm",
                  )}
                  style={{ height: `${(d.approved / max) * 100}%` }}
                  title={`${d.label}: ${d.approved} disetujui`}
                />
              </div>
              <span className="text-[10px] text-ink-mute">{d.label}</span>
              <span className="font-mono text-[10px] font-medium text-ink-soft">
                {total || ""}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-5 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sage" /> Disetujui
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rust" /> Ditolak
        </span>
      </div>
    </div>
  );
}
