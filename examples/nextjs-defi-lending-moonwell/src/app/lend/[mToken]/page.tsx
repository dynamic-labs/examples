"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { SupplyWithdrawForm } from "@/components/SupplyWithdrawForm";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { BASESCAN_URL, MUSDC_ADDRESS } from "@/lib/constants";
import { useBalances, useMarkets } from "@/lib/hooks";
import {
  assetDisplayName,
  findMarketByMToken,
  formatApy,
  formatUsd,
} from "@/lib/moonwell";
import { useWallet } from "@/lib/providers";

export default function MarketDetailPage() {
  const params = useParams<{ mToken: string }>();
  const mTokenAddress = params.mToken;

  // Supplying is wired up for the native USDC market only — see the note below.
  const isUsdcMarket =
    mTokenAddress.toLowerCase() === MUSDC_ADDRESS.toLowerCase();

  const { evmAccount } = useWallet();
  const { data: markets, error: marketsError } = useMarkets();
  const {
    data: balances,
    isLoading: balancesLoading,
    error: balancesError,
  } = useBalances(isUsdcMarket ? evmAccount?.address : undefined);

  const market = markets && findMarketByMToken(markets, mTokenAddress);

  // Only 404 once the list has actually loaded — an unknown address is a real
  // miss, a pending fetch is not.
  if (markets && !market) {
    notFound();
  }

  // A failed markets fetch would otherwise leave the stat skeletons up
  // forever; say what happened instead, like the list page does.
  if (marketsError && !markets) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-sm text-red-600">
          Could not load this market: {marketsError.message}
        </p>
      </div>
    );
  }

  const stats = [
    { label: "Supply APY", value: market && formatApy(market.baseSupplyApy) },
    {
      label: "APY incl. rewards",
      value: market && formatApy(market.totalSupplyApr),
    },
    {
      label: "Total supplied",
      value: market && formatUsd(market.totalSupplyUsd),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link
        href="/lend"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        All markets
      </Link>

      <div className="flex items-center gap-3">
        {market ? (
          <TokenIcon symbol={market.asset} size={44} />
        ) : (
          <Skeleton className="w-11 h-11 rounded-full" />
        )}
        <div className="min-w-0">
          {market ? (
            <>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {market.asset}
                </h1>
                <Badge color="base">Base</Badge>
              </div>
              <p className="text-sm text-muted">
                {assetDisplayName(market.asset)}
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-line p-4 space-y-2"
          >
            <p className="text-sm text-muted">{label}</p>
            {value ? (
              <p className="tabular text-xl">{value}</p>
            ) : (
              <Skeleton className="h-7 w-20" />
            )}
          </div>
        ))}
      </div>

      {isUsdcMarket ? (
        <>
          <BalanceDisplay
            balances={balances}
            isLoading={!!evmAccount && balancesLoading}
            error={
              evmAccount && balancesError ? balancesError.message : undefined
            }
          />
          <SupplyWithdrawForm
            balances={balances}
            balancesError={!!evmAccount && !!balancesError}
          />
        </>
      ) : (
        <div className="rounded-2xl border border-line p-6 text-center space-y-2">
          <p className="text-sm">
            This example only wires up supply and withdraw for the USDC market.
          </p>
          <p className="text-sm text-muted">
            Every other market is listed read-only, with live rates straight from
            the Moonwell API.
          </p>
          <Link
            href={`/lend/${MUSDC_ADDRESS}`}
            className="inline-block mt-2 text-sm font-medium py-1.5 px-4 rounded-lg border border-brand text-brand hover:bg-chip transition-colors"
          >
            Go to the USDC market
          </Link>
        </div>
      )}

      <a
        href={`${BASESCAN_URL}/address/${mTokenAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block font-mono text-xs text-muted hover:text-brand transition-colors break-all"
      >
        {mTokenAddress}
      </a>
    </div>
  );
}
