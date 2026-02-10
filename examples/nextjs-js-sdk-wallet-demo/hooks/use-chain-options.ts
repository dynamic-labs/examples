"use client";

import { useMemo } from "react";
import { useNetworks } from "./use-networks";
import type { Chain } from "@/lib/dynamic";

/**
 * Chain option for wallet creation
 */
export interface ChainOption {
  /** Chain identifier from Dynamic SDK */
  id: Chain;
  /** Display name */
  name: string;
  /** Comma-separated list of available networks */
  description: string;
  /** Icon URL from first network of this chain */
  icon?: string;
}

/**
 * Derive unique chain options from enabled networks
 *
 * Groups networks by chain type (EVM, SOL, etc.) and collects
 * network names for the description. Uses the first network's
 * icon for each chain family.
 *
 * @returns Array of chain options derived from SDK networks data
 *
 * @example
 * ```tsx
 * const chainOptions = useChainOptions();
 * // [
 * //   { id: "EVM", name: "EVM", description: "Ethereum, Base, Sepolia", icon: "..." },
 * //   { id: "SOL", name: "SOL", description: "Solana", icon: "..." }
 * // ]
 * ```
 */
export function useChainOptions(): ChainOption[] {
  const { networks } = useNetworks();

  return useMemo<ChainOption[]>(() => {
    const chainMap = new Map<
      Chain,
      { icon?: string; networkNames: string[] }
    >();

    // Group networks by chain and collect their display names
    for (const network of networks) {
      // network.chain is already typed as Chain from the SDK
      const chain = network.chain as Chain;
      const existing = chainMap.get(chain);
      if (existing) {
        existing.networkNames.push(network.displayName);
      } else {
        chainMap.set(chain, {
          icon: network.iconUrl,
          networkNames: [network.displayName],
        });
      }
    }

    // Build chain options with derived descriptions
    return Array.from(chainMap.entries()).map(([chain, data]) => ({
      id: chain,
      name: chain,
      description: data.networkNames.join(", "),
      icon: data.icon,
    }));
  }, [networks]);
}
