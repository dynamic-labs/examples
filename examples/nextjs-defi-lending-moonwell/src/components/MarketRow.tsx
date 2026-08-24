"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { TokenIcon } from "@/components/ui/TokenIcon";
import {
  assetDisplayName,
  formatApy,
  formatUsd,
  type Market,
} from "@/lib/moonwell";

/**
 * One row of the market list, laid out like the moonwell.fi markets table.
 *
 * The whole row is the link — "View Market" is a visual target inside it, not a
 * separate control, so there is only ever one anchor per row to tab to.
 */
export function MarketRow({ market }: { market: Market }) {
  return (
    <Link
      href={`/lend/${market.mTokenAddress}`}
      aria-label={`View the ${market.asset} market`}
      className="group grid grid-cols-2 sm:grid-cols-[minmax(0,2fr)_7rem_minmax(0,1fr)_minmax(0,1fr)_8.5rem] items-center gap-4 py-5 -mx-3 px-3 rounded-lg border-b border-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <TokenIcon symbol={market.asset} />
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{market.asset}</p>
          <p className="text-xs text-muted truncate">
            {assetDisplayName(market.asset)}
          </p>
        </div>
      </div>

      <div className="hidden sm:block">
        <Badge color="base">Base</Badge>
      </div>

      <div className="text-right sm:text-left">
        <p className="text-[10px] uppercase tracking-wide text-muted sm:hidden">
          Supply APY
        </p>
        <p className="tabular text-sm">{formatApy(market.baseSupplyApy)}</p>
      </div>

      <div className="hidden sm:block">
        <p className="tabular text-sm text-muted">
          {formatUsd(market.totalSupplyUsd)}
        </p>
      </div>

      <div className="col-span-2 sm:col-span-1 sm:justify-self-end">
        {/* A span, not a link: the row is already the anchor, and a nested
            interactive element would be announced twice. */}
        <span className="inline-block text-sm font-medium py-1 px-3 rounded-lg border border-line group-hover:border-brand group-hover:text-brand transition-colors">
          View Market
        </span>
      </div>
    </Link>
  );
}
