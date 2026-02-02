"use client";

import { useSdkQuery } from "./use-sdk-query";
import { getNetworksData, type NetworkData } from "@/lib/dynamic-client";

/**
 * Hook to get all available networks
 */
export function useNetworks() {
  const { data, refetch, isLoading, error } = useSdkQuery<NetworkData[]>({
    queryKey: ["networks"],
    queryFn: getNetworksData,
    refetchEvent: "walletProviderChanged",
  });

  return {
    networks: data ?? [],
    refetch,
    isLoading,
    error,
  };
}
