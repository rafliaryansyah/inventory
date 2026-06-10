import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Accent = "amber" | "navy" | "sage" | "rust";

const ACCENT_TEXT: Record<Accent, string> = {
  amber: "text-amber-dk",
  navy: "text-navy",
  sage: "text-sage",
  rust: "text-rust",
};

export function MetricCard({
  label,
  value,
  suffix,
  hint,
  trend,
  accent = "amber",
}: {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  hint?: string;
  /** Percentage change; positive renders sage ↑, negative rust ↓. */
  trend?: number | null;
  accent?: Accent;
}) {
  const hasTrend = trend !== null && trend !== undefined;
  const up = (trend ?? 0) >= 0;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow text-ink-mute">{label}</p>
        {hasTrend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-xs font-medium",
              up ? "bg-sage-sf text-sage" : "bg-rust-sf text-rust",
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend ?? 0)}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn("display-serif text-[44px] leading-none", ACCENT_TEXT[accent])}
        >
          {value}
        </span>
        {suffix && <span className="text-sm text-ink-mute">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-ink-mute">{hint}</p>}
    </Card>
  );
}
