import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

type AvatarColor = "navy" | "amber" | "sage" | "rust" | string | null | undefined;
type AvatarSize = "sm" | "md" | "lg";

const COLORS: Record<string, string> = {
  navy: "bg-navy text-paper",
  amber: "bg-amber text-paper",
  sage: "bg-sage text-paper",
  rust: "bg-rust text-paper",
};

const SIZES: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color?: AvatarColor;
  size?: AvatarSize;
  className?: string;
}) {
  const palette = (color && COLORS[color]) || COLORS.amber;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-serif font-medium select-none shrink-0",
        SIZES[size],
        palette,
        className,
      )}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
