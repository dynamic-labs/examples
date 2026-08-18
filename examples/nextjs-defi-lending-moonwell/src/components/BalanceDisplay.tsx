"use client";

import type { Balances } from "@/lib/hooks";
import { formatUsdcAmount } from "@/lib/moonwell";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Wallet balance next to the supplied balance. The supplied figure is derived
 * from the mToken balance and the current exchange rate, so it grows with
 * accrued interest without any extra bookkeeping.
 */
export function BalanceDisplay({
  balances,
  isLoading,
  error,
}: {
  balances?: Balances;
  isLoading: boolean;
  /** Message from a failed balance read — distinct from being signed out. */
  error?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-line p-4 space-y-2">
        <p className="text-sm text-muted">Wallet balance</p>
        {isLoading ? (
          <Skeleton className="h-7 w-32" />
        ) : (
          <p className="tabular text-2xl">
            {balances ? formatUsdcAmount(balances.walletUsdc) : "—"}
            <span className="text-muted text-base ml-1.5">USDC</span>
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-line p-4 space-y-2">
        <p className="text-sm text-muted">Supplied</p>
        {isLoading ? (
          <Skeleton className="h-7 w-32" />
        ) : (
          <>
            <p className="tabular text-2xl">
              {balances ? formatUsdcAmount(balances.suppliedUsdc) : "—"}
              <span className="text-muted text-base ml-1.5">USDC</span>
            </p>
            {!balances &&
              // A failed read is not the same as being signed out — never ask
              // a user with a live position to "sign in" over an RPC error.
              (error ? (
                <p className="text-xs text-red-600 break-words">
                  Could not read your balances: {error}
                </p>
              ) : (
                <p className="text-xs text-muted">
                  Sign in to see your position
                </p>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
