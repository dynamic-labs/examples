/**
 * Application providers configuration
 *
 * This file sets up the root providers for the application:
 * - ThemeProvider: Handles light/dark mode switching
 * - DynamicContextProvider: Configures Dynamic SDK with wallet connectors
 *
 * CSS Overrides:
 * The cssOverrides prop customizes the Dynamic embedded widget appearance.
 * These styles target the Shadow DOM and use !important to override defaults.
 *
 * @see https://www.dynamic.xyz/docs/using-our-ui/design-customizations
 */
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { env } from "@/env";
import {
  DynamicContextProvider,
  EthereumWalletConnectors,
  ZeroDevSmartWalletConnectors,
} from "@/lib/dynamic";

const cssOverrides = `
  /* Hide the separator line above "Powered by" */
  .dynamic-footer__top-border {
    border-top: none !important;
  }
  
  /* Style the "Log in or sign up" title with Dynamic blue */
  .typography--primary {
    color: #4679FE !important;
  }
`;

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DynamicContextProvider
        theme="auto"
        settings={{
          environmentId: env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
          walletConnectors: [
            EthereumWalletConnectors,
            ZeroDevSmartWalletConnectors,
          ],
          cssOverrides,
        }}
      >
        {children}
      </DynamicContextProvider>
    </ThemeProvider>
  );
}
