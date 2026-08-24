import { cn } from "@/lib/utils";

const COLORS = {
  base: "bg-chip text-chip-ink",
  green: "bg-green-50 text-green-700",
  grey: "bg-line text-muted",
} as const;

/** Small chip, matching the network/market-type badges in the Moonwell app. */
export function Badge({
  color = "grey",
  children,
  className,
}: {
  color?: keyof typeof COLORS;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block text-xs py-1 px-2 rounded-md",
        COLORS[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
