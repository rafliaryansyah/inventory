import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: string;
  /** Pass a string, or JSX with an italic-amber accent word. */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="eyebrow text-amber-dk mb-2">{eyebrow}</p>
        )}
        <h1 className="display-serif text-[32px] leading-tight md:text-[42px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-ink-soft max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
