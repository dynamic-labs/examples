"use client";

import { useState } from "react";
import { env } from "@/env";
import {
  DynamicContextProvider,
  DynamicUserProfile,
} from "@dynamic-labs/sdk-react-core";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/Toast";
import { LiFiProvider } from "./lifi-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <DynamicContextProvider
      theme="dark"
      settings={{
        environmentId: env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
        walletConnectors: [SolanaWalletConnectors],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <LiFiProvider>
          <ToastProvider>
            {children}
            <DynamicUserProfile />
          </ToastProvider>
        </LiFiProvider>
      </QueryClientProvider>
    </DynamicContextProvider>
  );
}

