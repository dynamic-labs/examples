"use client";

import { useState, useEffect, useRef } from "react";
import { LiFiProvider } from "@/lib/lifi-provider";
import { config } from "@/lib/wagmi";
import { env } from "@/env";
import {
  DynamicContextProvider,
  DynamicUserProfile,
  EthereumWalletConnectors,
  useDynamicContext,
  useSwitchNetwork,
  isEthereumWallet,
} from "@/lib/dynamic";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import type { CreateConnectorFn } from "wagmi";
import { ToastProvider } from "@/components/ui/Toast";

const POLYGON_CHAIN_ID = 137;

function NetworkSwitcher() {
  const { primaryWallet } = useDynamicContext();
  const switchNetwork = useSwitchNetwork();
  const hasSwitchedRef = useRef(false);

  useEffect(() => {
    if (!primaryWallet) {
      hasSwitchedRef.current = false;
      return;
    }

    if (!isEthereumWallet(primaryWallet)) {
      return;
    }

    const switchToPolygon = async () => {
      if (hasSwitchedRef.current) return;

      try {
        const walletClient = await primaryWallet.getWalletClient();
        const currentChainId = await walletClient.getChainId();

        if (currentChainId !== POLYGON_CHAIN_ID) {
          await switchNetwork({
            wallet: primaryWallet,
            network: POLYGON_CHAIN_ID,
          });
        }
        hasSwitchedRef.current = true;
      } catch {
        // Network switch failed
      }
    };

    const timeoutId = setTimeout(switchToPolygon, 500);
    return () => clearTimeout(timeoutId);
  }, [primaryWallet, switchNetwork]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const connectors: CreateConnectorFn[] = [];

  return (
    <DynamicContextProvider
      theme="dark"
      settings={{
        environmentId: env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
        walletConnectors: [EthereumWalletConnectors],
        cssOverrides: <link rel="stylesheet" href="/dynamicOverrides.css" />,
        termsOfServiceUrl: "https://www.example.com",
        privacyPolicyUrl: "https://www.example.com",
        policiesConsentInnerComponent:
          "I agree to the terms of service and privacy policy",
        logLevel: "ERROR",
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <LiFiProvider wagmiConfig={config} connectors={connectors}>
              <ToastProvider>
                <NetworkSwitcher />
                {children}
                <DynamicUserProfile />
              </ToastProvider>
            </LiFiProvider>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
