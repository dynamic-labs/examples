"use client";

/**
 * Gas Sponsorship Hook
 *
 * Determines if gas sponsorship is available for an EVM wallet on the current network,
 * and returns the appropriate wallet to use for transactions.
 *
 * Flow:
 * 1. Find ZeroDev and base wallets for the address
 * 2. Switch ZeroDev wallet to target network
 * 3. Call canSponsorTransaction to check sponsorship
 * 4. Return walletToUse: ZeroDev if sponsored, base otherwise
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/zerodev/can-sponsor-transaction
 */

import { useQuery } from "@tanstack/react-query";
import { parseEther, zeroAddress } from "viem";
import {
  canSponsorTransaction,
  switchActiveNetwork,
  isEvmWalletAccount,
  type WalletAccount,
  type NetworkData,
  type EvmWalletAccount,
} from "@/lib/dynamic-client";
import { getBaseWalletForAddress } from "@/lib/wallet-utils";

export interface UseGasSponsorshipResult {
  /** Whether gas sponsorship is available on the current network */
  isSponsored: boolean;
  /** Whether the sponsorship check is in progress */
  isLoading: boolean;
  /** The wallet to use for transactions (ZeroDev if sponsored, base otherwise) */
  walletToUse: EvmWalletAccount | undefined;
  /** The ZeroDev wallet for this address (if available) */
  zerodevWallet: EvmWalletAccount | undefined;
  /** The base (non-ZeroDev) wallet for this address */
  baseWallet: EvmWalletAccount | undefined;
}

/**
 * Check gas sponsorship and determine which wallet to use for EVM transactions
 *
 * @param walletAddress - The wallet address to check (undefined for non-EVM)
 * @param allWalletAccounts - All wallet accounts to search for ZeroDev/base wallets
 * @param networkData - Target network to check sponsorship for
 */
export function useGasSponsorship(
  walletAddress: string | undefined,
  allWalletAccounts: WalletAccount[],
  networkData: NetworkData | undefined,
): UseGasSponsorshipResult {
  // Find ZeroDev wallet for this address
  const zerodevWallet = walletAddress
    ? allWalletAccounts.find(
        (w) =>
          w.address.toLowerCase() === walletAddress.toLowerCase() &&
          w.walletProviderKey.includes("zerodev") &&
          isEvmWalletAccount(w),
      )
    : undefined;

  // Find base wallet (non-ZeroDev)
  const baseWallet = walletAddress
    ? (getBaseWalletForAddress(
        walletAddress,
        allWalletAccounts.filter(isEvmWalletAccount),
      ) as EvmWalletAccount | undefined)
    : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["gasSponsorship", walletAddress, networkData?.networkId],
    queryFn: async () => {
      if (!zerodevWallet || !networkData) return false;

      try {
        // Switch ZeroDev wallet to target network
        await switchActiveNetwork({
          networkId: networkData.networkId,
          walletAccount: zerodevWallet,
        });

        // Check if gas can be sponsored on this network
        const canSponsor = await canSponsorTransaction({
          walletAccount: zerodevWallet as EvmWalletAccount,
          transaction: { to: zeroAddress, value: parseEther("0"), data: "0x" },
        });

        return canSponsor;
      } catch {
        return false;
      }
    },
    enabled: !!zerodevWallet && !!networkData,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes per network
    refetchOnWindowFocus: false,
  });

  const isSponsored = data ?? false;

  // Determine which wallet to use:
  // - ZeroDev if sponsorship is available (for gasless transactions)
  // - Base wallet otherwise (user pays gas via viem)
  const walletToUse = isSponsored
    ? (zerodevWallet as EvmWalletAccount)
    : baseWallet;

  return {
    isSponsored,
    isLoading,
    walletToUse,
    zerodevWallet: zerodevWallet as EvmWalletAccount | undefined,
    baseWallet,
  };
}
