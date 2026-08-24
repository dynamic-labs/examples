import { cn } from "@/lib/utils";

/*
 * Token logos are third-party brand marks, so this example draws a monogram
 * instead of vendoring them. cbBTC → "BTC": the lowercase wrapper prefix is
 * stripped so wrapped assets read as what they wrap.
 */
const TINTS = [
  "bg-chip text-chip-ink",
  "bg-green-50 text-green-700",
  "bg-surface text-muted",
  "bg-line text-ink",
];

function tintFor(symbol: string) {
  const sum = [...symbol].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TINTS[sum % TINTS.length];
}

function monogram(symbol: string) {
  return symbol.replace(/^[a-z]+/, "").slice(0, 3) || symbol.slice(0, 3);
}

export function TokenIcon({
  symbol,
  size = 36,
  className,
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        "shrink-0 rounded-full flex items-center justify-center text-[11px] font-medium uppercase",
        tintFor(symbol),
        className,
      )}
    >
      {monogram(symbol)}
    </span>
  );
}
