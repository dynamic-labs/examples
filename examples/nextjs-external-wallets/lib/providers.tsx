"use client";

import {
  useWalletBookCdn,
  WalletBookContextProvider,
} from "@dynamic-labs/wallet-book";
import { ThemeProvider } from "@/components/theme-provider";
import {
  DynamicContextProvider,
  DynamicMultiWalletPromptsWidget,
  EthereumWalletConnectors,
  SolanaWalletConnectors,
} from "@/lib/dynamic";

/**
 * Application Providers
 *
 * Wraps the application with all necessary context providers:
 * - ThemeProvider: Handles light/dark mode theming
 * - DynamicContextProvider: Core Dynamic SDK provider for wallet authentication
 * - WalletBookContextProvider: Provides wallet metadata (icons, names) from CDN
 * - DynamicMultiWalletPromptsWidget: Handles multi-wallet prompts and modals
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  // Fetch wallet icons and metadata from Dynamic's CDN
  const walletBook = useWalletBookCdn();

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
          // "connect-and-sign" requires users to sign a message to prove wallet ownership
          // This creates a more secure authentication flow than "connect-only"
          initialAuthenticationMode: "connect-and-sign",

          // Your Dynamic environment ID from the dashboard
          environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,

          // Enable both Ethereum and Solana wallet connectors
          walletConnectors: [EthereumWalletConnectors, SolanaWalletConnectors],
        }}
      >
        {/* Provides wallet icons and display names for the UI */}
        <WalletBookContextProvider walletBook={walletBook}>
          {children}
        </WalletBookContextProvider>

        {/* Renders prompts for multi-wallet actions (linking, switching, etc.) */}
        <DynamicMultiWalletPromptsWidget />
      </DynamicContextProvider>
    </ThemeProvider>
  );
}
