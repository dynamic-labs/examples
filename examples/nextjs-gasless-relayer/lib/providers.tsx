"use client";

import {
  DynamicContextProvider,
  DynamicMultiWalletPromptsWidget,
} from "@dynamic-labs/sdk-react-core";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: "ba4d65d4-4983-4058-ac89-936edebd9e11",
        walletConnectors: [SolanaWalletConnectors],
      }}
    >
      {children}
      <DynamicMultiWalletPromptsWidget />
    </DynamicContextProvider>
  );
}

