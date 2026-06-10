import { cn } from "@/lib/utils";

export function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="eyebrow text-ink-soft flex items-center gap-1"
        >
          {label}
          {required && <span className="text-rust">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-rust">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-mute">{hint}</p>
      ) : null}
    </div>
  );
}
