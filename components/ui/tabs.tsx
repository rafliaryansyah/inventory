"use client";

import { cn } from "@/lib/utils";

export type TabItem = { key: string; label: string; count?: number };

export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 border-b border-line overflow-x-auto", className)}>
      {items.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "relative -mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-amber text-ink"
                : "border-transparent text-ink-mute hover:text-ink",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "inline-flex min-w-[20px] items-center justify-center rounded-sm px-1.5 py-0.5 text-xs font-semibold",
                  isActive ? "bg-amber-sf text-amber-dk" : "bg-warm text-ink-mute",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
