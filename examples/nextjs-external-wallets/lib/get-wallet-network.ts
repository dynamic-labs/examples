/**
 * Wallet Network Utilities
 *
 * Note: This file is retained for reference but is no longer used.
 * The new headless JS SDK uses embedded (MPC/WaaS) wallets which do not
 * expose connector-based network info in the same way as the old React SDK.
 * Network information is instead managed by the SDK client directly.
 */

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
export const SOLANA_NETWORK: NetworkInfo = {
  name: "Solana",
  iconUrl: "https://app.dynamic.xyz/assets/networks/solana.svg",
};

/** Default EVM network info */
export const EVM_NETWORK: NetworkInfo = {
  name: "Ethereum",
  iconUrl: "https://app.dynamic.xyz/assets/networks/eth.svg",
};
