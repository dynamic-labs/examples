"use client";

import { useSdkQuery } from "./use-sdk-query";
import {
  getActiveNetworkData,
  type WalletAccount,
  type NetworkData,
} from "@/lib/dynamic";

/**
 * Hook to get active network for a wallet with reactive updates
 */
export function useActiveNetwork(walletAccount: WalletAccount | null) {
  const { data, refetch, isLoading, error } = useSdkQuery<{
    networkData: NetworkData | undefined;
  }>({
    queryKey: ["activeNetwork", walletAccount?.id],
    queryFn: () =>
      walletAccount
        ? getActiveNetworkData({ walletAccount })
        : Promise.resolve({ networkData: undefined }),
    refetchEvent: "walletProviderChanged",
    eventFilter: (payload) =>
      (payload as { walletProviderKey?: string })?.walletProviderKey ===
      walletAccount?.walletProviderKey,
    enabled: !!walletAccount,
  });

  return {
    networkData: data?.networkData,
    refetch,
    isLoading,
    error,
  };
}
