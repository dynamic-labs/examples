/**
 * Wallet Network Utilities
 *
 * Helper functions for fetching network information from connected wallets.
 * Supports both Ethereum and Solana wallets.
 */

import { isEthereumWallet } from "@dynamic-labs/ethereum";
import type { Wallet } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet } from "@dynamic-labs/solana";

/** Network display information */
export interface NetworkInfo {
  name: string;
  iconUrl?: string;
}

/** Result from fetching wallet network */
export interface NetworkResult {
  network: NetworkInfo;
  networkId: string | number | null;
}

/** Default Solana network info */
const SOLANA_NETWORK: NetworkInfo = {
  name: "Solana",
  iconUrl: "https://app.dynamic.xyz/assets/networks/solana.svg",
};

/** Fallback for unknown networks */
const UNKNOWN_NETWORK: NetworkInfo = { name: "Unknown" };

/**
 * Fetches network information for a given wallet.
 *
 * - For Solana wallets: Returns static Solana network info
 * - For Ethereum wallets: Queries the connector for the current network
 * - For other wallets: Returns unknown network
 *
 * @param wallet - The wallet to fetch network info for
 * @returns Network information including name, icon URL, and network ID
 */
export async function fetchWalletNetwork(
  wallet: Wallet | null
): Promise<NetworkResult> {
  // Handle null wallet
  if (!wallet) {
    return { network: UNKNOWN_NETWORK, networkId: null };
  }

  // Solana wallets don't have multiple networks in the same way Ethereum does
  if (isSolanaWallet(wallet)) {
    return { network: SOLANA_NETWORK, networkId: null };
  }

  // Only Ethereum wallets have network switching capabilities
  if (!isEthereumWallet(wallet)) {
    return { network: UNKNOWN_NETWORK, networkId: null };
  }

  // Get the Ethereum connector to query network info
  const connector = wallet.connector;
  if (!connector?.getEnabledNetworks) {
    return { network: UNKNOWN_NETWORK, networkId: null };
  }

  // Get list of networks enabled in the Dynamic dashboard
  const enabledNetworks = connector.getEnabledNetworks();
  if (!enabledNetworks || enabledNetworks.length === 0) {
    return { network: UNKNOWN_NETWORK, networkId: null };
  }

  // Try to get the wallet's current network
  let networkId: string | number | undefined;
  try {
    networkId = await connector.getNetwork();
  } catch {
    // If we can't get the current network, use the first enabled network as fallback
    const defaultNetwork = enabledNetworks[0];
    return {
      network: {
        name: defaultNetwork.vanityName || defaultNetwork.name || "Unknown",
        iconUrl: defaultNetwork.iconUrls?.[0],
      },
      networkId: null,
    };
  }

  // Find the network info matching the current network ID
  const networkInfo = enabledNetworks.find(
    (n) => String(n.chainId || n.networkId) === String(networkId)
  );

  return {
    network: {
      name: networkInfo?.vanityName || networkInfo?.name || "Unknown",
      iconUrl: networkInfo?.iconUrls?.[0],
    },
    networkId: networkId ?? null,
  };
}
