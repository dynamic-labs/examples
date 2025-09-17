"use client";

import { RefreshCw } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { useTokenBalanceContext } from "./token-balance-context";

interface WalletBalanceDisplayProps {
  tokenAddress: string;

  label?: string;
  showUSDC?: boolean;
  className?: string;
  balanceClassName?: string;
  refreshIconSize?: "sm" | "md";
}

export default function WalletBalanceDisplay({
  tokenAddress,
  label = "Wallet Balance",
  showUSDC = false,
  className,
  balanceClassName,
  refreshIconSize = "sm",
}: WalletBalanceDisplayProps) {
  const { getBalanceByAddress, isLoading, refetch } = useTokenBalanceContext();
  const tokenBalance = getBalanceByAddress(tokenAddress);

  const balance = tokenBalance?.balance;
  const onRefresh = () => refetch(true);

  const formatBalance = (balance: string | number | undefined) => {
    if (balance === undefined || balance === null) return "0";
    if (showUSDC) return `${balance.toLocaleString()} USDC`;
    return balance.toString();
  };

  const iconSize = refreshIconSize === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <div className={cn("flex justify-between", className)}>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <span
        className={cn("text-sm font-medium text-foreground", balanceClassName)}
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Skeleton className="h-7 w-10" />
          ) : (
            <>{formatBalance(balance)}</>
          )}
          <button
            className="cursor-pointer"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn(
                iconSize + " text-muted-foreground",
                isLoading && "animate-spin"
              )}
            />
          </button>
        </div>
      </span>
    </div>
  );
}
