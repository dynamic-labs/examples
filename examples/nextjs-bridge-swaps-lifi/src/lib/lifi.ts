import { ChainType, EVM, createConfig, getChains } from "@lifi/sdk";
import { getWalletClient, switchChain } from "@wagmi/core";
import type { Config } from "wagmi";

export const initializeLiFiConfig = (wagmiConfig: Config) => {
  return createConfig({
    integrator: "Dynamic",
    providers: [
      EVM({
        getWalletClient: () => {
          const client = getWalletClient(wagmiConfig);
          return client;
        },
        switchChain: async (chainId) => {
          try {
            const chain = await switchChain(wagmiConfig, { chainId });
            const client = getWalletClient(wagmiConfig, { chainId: chain.id });
            return client;
          } catch (error) {
            throw error;
          }
        },
      }),
    ],
    apiKey: process.env.NEXT_PUBLIC_LIFI_API_KEY,
  });
};

export const loadLiFiChains = async () => {
  try {
    const chains = await getChains({
      chainTypes: [ChainType.EVM],
    });
    return chains;
  } catch {
    return [];
  }
};
