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
        cssOverrides: <link rel="stylesheet" href="/dynamicOverrides.css" />,
        termsOfServiceUrl: "https://www.example.com",
        privacyPolicyUrl: "https://www.example.com",
        policiesConsentInnerComponent:
          "I agree to the terms of service and privacy policy",
        logLevel: "ERROR",
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

