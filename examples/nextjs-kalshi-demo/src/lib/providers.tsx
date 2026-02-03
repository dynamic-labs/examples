"use client";

import { useState } from "react";
import { env } from "@/env";
import {
  DynamicContextProvider,
  DynamicUserProfile,
  SolanaWalletConnectors,
} from "@/lib/dynamic";
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

