"use client";

import { useEffect } from "react";
import { DynamicProvider, useEvent } from "@dynamic-labs-sdk/react-hooks";
import {
  completeSocialRedirect,
  detectSocialRedirectUrl,
} from "@dynamic-labs-sdk/client";
import {
  createWaasWalletAccounts,
  getChainsMissingWaasWalletAccounts,
} from "@dynamic-labs-sdk/client/waas";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { dynamicClient, initDynamic } from "./dynamic";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function DynamicBootstrap() {
  useEffect(() => {
    let cancelled = false;
    initDynamic().then(async () => {
      if (cancelled || typeof window === "undefined") return;
      try {
        const url = new URL(window.location.href);
        if (await detectSocialRedirectUrl({ url })) {
          await completeSocialRedirect({ url });
          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch {
        /* not a social redirect */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}

function WalletBootstrap() {
  useEvent({
    event: "userChanged",
    listener: async (user) => {
      if (!user) return;
      const missing = getChainsMissingWaasWalletAccounts(dynamicClient);
      if (missing.length > 0) {
        await createWaasWalletAccounts({ chains: missing }, dynamicClient);
      }
    },
  });
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicProvider client={dynamicClient}>
      <QueryClientProvider client={queryClient}>
        <DynamicBootstrap />
        <WalletBootstrap />
        {children}
      </QueryClientProvider>
    </DynamicProvider>
  );
}
