"use client";

/**
 * Gas Sponsorship Hook
 *
 * Determines if gas sponsorship is available on the current network,
 * and returns the appropriate wallet to use for transactions.
 *
 * Sponsorship is determined by checking the ZeroDev provider configuration
 * in projectSettings.providers[].multichainAccountAbstractionProviders[].
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/zerodev/can-sponsor-transaction
 */

import {
  isEvmWalletAccount,
  isNetworkSponsored,
  type WalletAccount,
  type NetworkData,
  type EvmWalletAccount,
} from "@/lib/dynamic";
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

  // Check if network has sponsorship configured (from projectSettings)
  const isSponsored = networkData?.networkId
    ? isNetworkSponsored(networkData.networkId)
    : false;

  // Determine which wallet to use:
  // - ZeroDev if sponsorship is available (for gasless transactions)
  // - Base wallet otherwise (user pays gas via viem)
  const walletToUse = isSponsored
    ? (zerodevWallet as EvmWalletAccount)
    : baseWallet;

  return {
    isSponsored,
    isLoading: false,
    walletToUse,
    zerodevWallet: zerodevWallet as EvmWalletAccount | undefined,
    baseWallet,
  };
}
