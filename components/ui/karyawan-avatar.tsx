import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const BOX: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};
const ICON: Record<Size, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

/** Ikon vektor karyawan (lucide UserRound) dalam lingkaran. */
export function KaryawanAvatar({
  size = "md",
  active = true,
  className,
}: {
  size?: Size;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        active ? "bg-amber-sf text-amber-dk" : "bg-line text-ink-mute",
        BOX[size],
        className,
      )}
    >
      <UserRound className={ICON[size]} strokeWidth={2} />
    </span>
  );
}
