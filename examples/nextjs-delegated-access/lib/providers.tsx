"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { env } from "@/env";
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
          environmentId: env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
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
