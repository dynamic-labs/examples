import { ChainType, EVM, createConfig, getChains } from "@lifi/sdk";
import { getWalletClient, switchChain } from "@wagmi/core";
import type { Config } from "wagmi";

export const initializeLiFiConfig = (wagmiConfig: Config) => {
  const config = wagmiConfig as any;

  return createConfig({
    integrator: "Dynamic",
    providers: [
      EVM({
        getWalletClient: () => getWalletClient(config),
        switchChain: async (chainId: number) => {
          const chain = await switchChain(config, { chainId });
          return getWalletClient(config, { chainId: chain.id });
        },
      } as any),
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
