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
import { PublicKey } from "@solana/web3.js";

export const LiFiProvider: FC<PropsWithChildren> = ({ children }) => {
  const { sdkHasLoaded, primaryWallet } = useDynamicContext();
  const initRef = useRef(false);
  // Keep a ref so the stable getWalletAdapter always reads the latest wallet
  const primaryWalletRef = useRef(primaryWallet);
  useEffect(() => {
    primaryWalletRef.current = primaryWallet;
  }, [primaryWallet]);

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

  // Stable function (no deps) — always reads from ref so LiFi always gets the current wallet.
  // We build a minimal SignerWalletAdapter shape that LiFi's SolanaStepExecutor requires:
  //   publicKey: @solana/web3.js PublicKey (has toString())
  //   signTransaction / signAllTransactions: delegated to Dynamic signer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getWalletAdapter = useCallback(async (): Promise<any> => {
    const wallet = primaryWalletRef.current;
    if (!wallet || !isSolanaWallet(wallet)) return null;
    const signer = await wallet.getSigner();
    return {
      publicKey: new PublicKey(wallet.address),
      signTransaction: signer.signTransaction.bind(signer),
      signAllTransactions: signer.signAllTransactions.bind(signer),
    };
  }, []);

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
