"use client";

import { RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@dynamic-labs/sdk-react-core";

import { Skeleton } from "../ui/skeleton";
import { UserCreditBalanceResponse } from "@/lib/rain";
import { cn } from "@/lib/utils";
import { formatBalance } from "@/utils/format-balance";

export default function CardBalance() {
  const authToken = getAuthToken();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery<{
    balance: UserCreditBalanceResponse;
  }>({
    queryKey: ["balance"],
    queryFn: () =>
      fetch("/api/balance", {
        headers: { Authorization: `Bearer ${authToken}` },
      }).then((res) => res.json()),
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  const handleRefresh = async () => {
    // Refetch both balance and transactions
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    ]);
  };

  return (
    <div className="w-full border border-border rounded-lg p-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Card Balance</span>
        {isLoading || isLoading === undefined ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {formatBalance(data?.balance?.spendingPower || 0)}
            </span>
            <button
              className="cursor-pointer p-1 rounded-md hover:bg-muted/50 transition-colors"
              onClick={handleRefresh}
              disabled={isRefetching}
              title="Refresh balance"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 text-muted-foreground",
                  isRefetching && "animate-spin"
                )}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
