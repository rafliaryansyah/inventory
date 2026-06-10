import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TimelineItem = {
  label: string;
  actor: string;
  at: Date | string;
  done?: boolean;
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-5">
      {items.map((item, i) => {
        const done = item.done ?? true;
        const isLast = i === items.length - 1;
        return (
          <li key={i} className="relative flex gap-3.5">
            {/* rail */}
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  "mt-0.5 h-3 w-3 shrink-0 rounded-full border-2",
                  done
                    ? "border-amber bg-amber"
                    : "border-line-dk bg-paper",
                )}
              />
              {!isLast && (
                <span className="mt-1 w-px flex-1 bg-line" aria-hidden />
              )}
            </div>
            <div className="-mt-0.5 pb-1">
              <p className="text-sm font-medium text-ink">{item.label}</p>
              <p className="mt-0.5 font-mono text-xs text-ink-mute">
                {item.actor} · {formatDateTime(item.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
