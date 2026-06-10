import { statusStyle } from "@/lib/status";
import { cn } from "@/lib/utils";

type BadgeProps = {
  /** Status code → maps to label + color (PLAN §5.6). */
  status?: string | null;
  /** Override the label text (defaults to the mapped label). */
  children?: React.ReactNode;
  className?: string;
};

export function Badge({ status, children, className }: BadgeProps) {
  const s = statusStyle(status);
  return (
    <span
      className={cn(
        "eyebrow inline-flex items-center rounded-sm px-2 py-1 leading-none",
        s.cls,
        className,
      )}
    >
      {children ?? s.label}
    </span>
  );
}
