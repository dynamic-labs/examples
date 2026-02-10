"use client";

/**
 * EIP-7702 Authorization Hook
 *
 * Checks if an EOA wallet has been upgraded to a smart account via EIP-7702.
 * Uses viem's getCode to check for the 7702 delegation prefix (0xef0100).
 *
 * Authorization is per-network, so switching networks will re-check.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { networkDataToViemChain } from "@/lib/viem-chain";
import type { NetworkData } from "@/lib/dynamic";

export interface Use7702AuthorizationResult {
  /** Whether the account has been authorized via 7702 on this network */
  isAuthorized: boolean;
  /** The bytecode at the address (includes 7702 prefix if authorized) */
  code: string | undefined;
  /** Whether the on-chain check is in progress */
  isLoading: boolean;
  /** Error if the check failed */
  error: Error | null;
  /** Invalidate the cache to force a re-check */
  invalidate: () => void;
}

/**
 * Check if an address has EIP-7702 authorization on the given network
 *
 * @param address - The wallet address to check (undefined skips the check)
 * @param networkData - The network to check on (undefined skips the check)
 * @returns Authorization status and utilities
 */
export function use7702Authorization(
  address: string | undefined,
  networkData: NetworkData | undefined,
): Use7702AuthorizationResult {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["7702-authorization", address, networkData?.networkId],
    queryFn: async () => {
      if (!address || !networkData?.rpcUrls?.http?.[0]) {
        return { isAuthorized: false, code: undefined };
      }

      const client = createPublicClient({
        chain: networkDataToViemChain(networkData),
        transport: http(networkData.rpcUrls.http[0]),
      });

      const code = await client.getCode({
        address: address as `0x${string}`,
      });

      // EIP-7702 delegation prefix: 0xef0100 followed by 20-byte delegate address
      // When an EOA is delegated via 7702, its code becomes: 0xef0100 + address
      const isAuthorized = code?.startsWith("0xef0100") ?? false;

      return { isAuthorized, code };
    },
    enabled: !!address && !!networkData?.rpcUrls?.http?.[0],
    staleTime: 30_000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["7702-authorization", address, networkData?.networkId],
    });
  };

  return {
    isAuthorized: query.data?.isAuthorized ?? false,
    code: query.data?.code,
    isLoading: query.isLoading,
    error: query.error,
    invalidate,
  };
}
