"use client";

import { config as lifiConfig } from "@lifi/sdk";
import { useSyncWagmiConfig } from "@lifi/wallet-management";
import { useQuery } from "@tanstack/react-query";
import { type FC, type PropsWithChildren, useEffect, useState, useCallback, useRef } from "react";
import type { Config, CreateConnectorFn } from "wagmi";
import { initializeLiFiConfig, loadLiFiChains } from "./lifi";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";

interface LiFiProviderProps extends PropsWithChildren {
  wagmiConfig: Config;
  connectors: CreateConnectorFn[];
}

export const LiFiProvider: FC<LiFiProviderProps> = ({ children, wagmiConfig, connectors }) => {
  const { sdkHasLoaded, primaryWallet } = useDynamicContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  const { data: chains, isLoading } = useQuery({
    queryKey: ["lifi-chains"],
    queryFn: async () => {
      const chains = await loadLiFiChains();
      if (chains.length > 0) lifiConfig.setChains(chains);
      return chains;
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    enabled: sdkHasLoaded,
  });

  const getDynamicWalletClient = useCallback(async () => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return null;
    return await primaryWallet.getWalletClient();
  }, [primaryWallet]);

  useEffect(() => {
    if (sdkHasLoaded && !initRef.current && chains?.length) {
      try {
        initializeLiFiConfig(wagmiConfig, getDynamicWalletClient);
        initRef.current = true;
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize LI.FI:", error);
      }
    }
  }, [sdkHasLoaded, wagmiConfig, getDynamicWalletClient, chains]);

  useSyncWagmiConfig(wagmiConfig, connectors, chains || undefined);

  if (isLoading || !sdkHasLoaded || !isInitialized) {
    return (
      <div className="flex justify-center items-center h-[100px] text-sm text-[#dde2f6] opacity-70">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
};
