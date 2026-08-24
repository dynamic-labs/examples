"use client";

import { MarketRow } from "@/components/MarketRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMarkets } from "@/lib/hooks";

export default function LendPage() {
  const { data: markets, isLoading, error } = useMarkets();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Markets</h1>
        <p className="text-sm text-muted">
          Supply assets to Moonwell on Base and earn interest.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,2fr)_7rem_minmax(0,1fr)_minmax(0,1fr)_8.5rem] gap-4 pb-2 border-b border-line text-sm text-muted">
        <span>Asset</span>
        <span className="hidden sm:block">Network</span>
        <span className="text-right sm:text-left">Supply APY</span>
        <span className="hidden sm:block">Total supplied</span>
        <span className="hidden sm:block" />
      </div>

      {isLoading ? (
        <div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="py-5 border-b border-line">
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-4 p-4 rounded-xl bg-red-50 text-sm text-red-600">
          Could not load markets: {error.message}
        </div>
      ) : (
        markets?.map((market) => (
          <MarketRow key={market.mTokenAddress} market={market} />
        ))
      )}

      {markets && (
        <p className="text-xs text-muted mt-6">
          {markets.length} active markets. Deprecated markets are filtered out —
          including the legacy USDbC market, which reports the same{" "}
          <code className="font-mono">mUSDC</code> symbol as native USDC.
        </p>
      )}
    </div>
  );
}
