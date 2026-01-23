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

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <DynamicContextProvider
      theme="dark"
      settings={{
        environmentId: env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
        walletConnectors: [SolanaWalletConnectors],
        cssOverrides: <link rel="stylesheet" href="/dynamicOverrides.css" />,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
          <DynamicUserProfile />
        </ToastProvider>
      </QueryClientProvider>
    </DynamicContextProvider>
  );
}

