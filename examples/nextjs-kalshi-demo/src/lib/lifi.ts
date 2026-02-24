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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initializeLiFiConfig = (getWalletAdapter: () => Promise<any> | any) => {
  return createConfig({
    integrator: "dynamic-kalshi-demo",
    providers: [
      Solana({
        getWalletAdapter,
      }),
    ],
    apiKey: env.NEXT_PUBLIC_LIFI_API_KEY,
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
