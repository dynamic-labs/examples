"use client";

import { config as lifiConfig } from "@lifi/sdk";
import { useQuery } from "@tanstack/react-query";
import {
  useEffect,
  useCallback,
  useRef,
  type FC,
  type PropsWithChildren,
} from "react";
import { initializeLiFiConfig, loadLiFiChains } from "./lifi";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet } from "@dynamic-labs/solana";

export const LiFiProvider: FC<PropsWithChildren> = ({ children }) => {
  const { sdkHasLoaded, primaryWallet } = useDynamicContext();
  const initRef = useRef(false);

  const { data: chains } = useQuery({
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

  const getWalletAdapter = useCallback(async () => {
    if (!primaryWallet || !isSolanaWallet(primaryWallet)) return null;
    // ISolana satisfies the methods LiFi actually uses at runtime (publicKey, signAllTransactions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await primaryWallet.getSigner()) as any;
  }, [primaryWallet]);

  useEffect(() => {
    if (sdkHasLoaded && !initRef.current && chains?.length) {
      try {
        initializeLiFiConfig(getWalletAdapter);
        initRef.current = true;
      } catch (error) {
        console.error("Failed to initialize LI.FI:", error);
      }
    }
  }, [sdkHasLoaded, getWalletAdapter, chains]);

  return <>{children}</>;
};
