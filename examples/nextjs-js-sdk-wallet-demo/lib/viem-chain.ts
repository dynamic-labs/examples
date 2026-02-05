/**
 * Viem Chain Utility
 *
 * Converts Dynamic's NetworkData to viem's Chain type for use with
 * viem public clients (e.g., for getCode calls).
 */

import { type Chain } from "viem";
import type { NetworkData } from "@/lib/dynamic-client";

/**
 * Parse chain ID from Dynamic's networkId string
 *
 * Dynamic uses formats like "evm-1" (Ethereum mainnet), "evm-137" (Polygon)
 * This extracts the numeric chain ID.
 */
function parseChainId(networkId: string): number {
  // Try to extract numeric part after "evm-" prefix
  const match = networkId.match(/evm-(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  // Default to 1 (mainnet) if parsing fails
  return 1;
}

/**
 * Convert Dynamic NetworkData to a viem Chain object
 *
 * @param networkData - Network configuration from Dynamic SDK
 * @returns A viem-compatible Chain object
 */
export function networkDataToViemChain(networkData: NetworkData): Chain {
  return {
    id: parseChainId(networkData.networkId),
    name: networkData.displayName,
    nativeCurrency: networkData.nativeCurrency,
    rpcUrls: {
      default: {
        http: networkData.rpcUrls?.http ?? [],
      },
    },
    blockExplorers: networkData.blockExplorerUrls?.[0]
      ? {
          default: {
            name: "Explorer",
            url: networkData.blockExplorerUrls[0],
          },
        }
      : undefined,
  };
}
