"use client";

import {
  ChainType,
  Solana,
  createConfig,
  getChains,
  getTokens,
  type ExtendedChain,
  type Token,
} from "@lifi/sdk";
import { env } from "@/env";

// LiFi's Solana chain ID
const SOL_CHAIN_ID = 1151111081099710;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initializeLiFiConfig = (getWalletAdapter: () => Promise<any> | any) => {
  // Provide our configured Solana RPC so LiFi uses it for balance checks
  // instead of the default public endpoint (which is rate-limited and unreliable)
  const rpcUrls = env.NEXT_PUBLIC_SOLANA_RPC_URL
    ? { [SOL_CHAIN_ID]: [env.NEXT_PUBLIC_SOLANA_RPC_URL] }
    : {};

  return createConfig({
    integrator: "dynamic-kalshi-demo",
    providers: [
      Solana({
        getWalletAdapter,
      }),
    ],
    apiKey: env.NEXT_PUBLIC_LIFI_API_KEY,
    rpcUrls,
  });
};

export const loadLiFiChains = async (): Promise<ExtendedChain[]> => {
  try {
    return await getChains({ chainTypes: [ChainType.SVM] });
  } catch (error) {
    console.error("Failed to load LI.FI chains:", error);
    return [];
  }
};

export const loadLiFiTokens = async (chainId: number): Promise<Token[]> => {
  try {
    const response = await getTokens({ chains: [chainId] });
    return response.tokens[chainId] || [];
  } catch (error) {
    console.error(`Failed to load tokens for chain ${chainId}:`, error);
    return [];
  }
};
