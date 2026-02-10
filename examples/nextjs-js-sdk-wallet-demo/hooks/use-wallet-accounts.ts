"use client";

import { useSdkQuery } from "./use-sdk-query";
import { getWalletAccounts, type WalletAccount } from "@/lib/dynamic";

/**
 * Hook to get wallet accounts with reactive updates
 */
export function useWalletAccounts() {
  const { data, refetch, isLoading, error } = useSdkQuery<WalletAccount[]>({
    queryKey: ["walletAccounts"],
    queryFn: getWalletAccounts,
    refetchEvent: "walletAccountsChanged",
  });

  return {
    walletAccounts: data ?? [],
    refetch,
    isLoading,
    error,
  };
}
