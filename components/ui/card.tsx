import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Remove inner padding (e.g. for tables). */
  padless?: boolean;
  /** Add hover-lift interaction. */
  interactive?: boolean;
};

export function Card({
  className,
  padless,
  interactive,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-paper border border-line rounded-lg shadow-soft",
        !padless && "p-6",
        interactive && "hover-lift cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}
