"use client";

/**
 * Gas Sponsorship Configuration
 *
 * Check which networks have gas sponsorship configured in the Dynamic dashboard,
 * including SVM (Solana) sponsorship.
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/zerodev/can-sponsor-transaction
 * @see https://www.dynamic.xyz/docs/javascript/reference/solana/svm-gas-sponsorship
 */

import { getClient } from "./client";

/**
 * Get network IDs that have gas sponsorship configured.
 *
 * Checks the ZeroDev provider in projectSettings for `multichainAccountAbstractionProviders`,
 * which contains the list of networks with sponsorship enabled.
 *
 * @returns Array of network IDs with sponsorship, or empty array if not configured
 */
export function getSponsoredNetworkIds(): string[] {
  const client = getClient();
  if (!client?.projectSettings) return [];

  const zerodevProvider = client.projectSettings.providers?.find(
    (p) => p.provider === "zerodev",
  );

  if (!zerodevProvider) return [];

  const sponsoredNetworks =
    zerodevProvider.multichainAccountAbstractionProviders?.map(
      (p) => p.chain,
    ) ?? [];

  return sponsoredNetworks;
}

/**
 * Check if a specific network has gas sponsorship configured.
 *
 * @param networkId - The network ID to check
 * @returns true if sponsorship is configured for this network
 */
export function isNetworkSponsored(networkId: string): boolean {
  const sponsoredNetworks = getSponsoredNetworkIds();
  return sponsoredNetworks.includes(networkId);
}

/**
 * Check if SVM (Solana) gas sponsorship is enabled.
 *
 * When enabled, use `signAndSendSponsoredTransaction` from `@/lib/dynamic`
 * to explicitly send sponsored Solana transactions. The function sends the
 * transaction to Dynamic's backend, replaces the fee payer, and broadcasts.
 *
 * @returns true if SVM gas sponsorship is enabled in the dashboard
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/solana/svm-gas-sponsorship
 */
export function isSvmGasSponsorshipEnabled(): boolean {
  const client = getClient();
  if (!client?.projectSettings) return false;

  // Access the SDK settings for embedded wallets
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sdkSettings = (client.projectSettings as any)?.sdk?.embeddedWallets;
  return sdkSettings?.svmGasSponsorshipEnabled ?? false;
}
