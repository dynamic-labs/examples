"use client";

import { ThemeProvider } from "@/components/theme-provider";
import {
  DynamicContextProvider,
  EthereumWalletConnectors,
  ZeroDevSmartWalletConnectors,
} from "@/lib/dynamic";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DynamicContextProvider
        theme="light"
        settings={{
          environmentId:
            // replace with your own environment ID
            process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID ||
            "e552c8b4-e9dd-454b-b309-16cba85aef47",
          walletConnectors: [
            EthereumWalletConnectors,
            ZeroDevSmartWalletConnectors,
          ],
        }}
      >
        {children}
      </DynamicContextProvider>
    </ThemeProvider>
  );
}
