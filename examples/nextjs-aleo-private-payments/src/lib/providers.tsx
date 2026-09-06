"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DynamicProvider, useOnEvent } from "@dynamic-labs-sdk/react-hooks";
import {
  createWaasWalletAccounts,
  getChainsMissingWaasWalletAccounts,
} from "@dynamic-labs-sdk/client/waas";
import { dynamicClient } from "@/lib/dynamic";

const queryClient = new QueryClient();

/**
 * Embedded wallets are not created by logging in, so creation is triggered here
 * after authentication. `getChainsMissingWaasWalletAccounts()` is the right
 * signal: guarding on the account list can read a stale non-empty list straight
 * after auth and skip creation entirely.
 */
function WaasBootstrap() {
  useOnEvent({
    event: "userChanged",
    listener: async ({ user }) => {
      if (!user) return;

      const missingChains = getChainsMissingWaasWalletAccounts();
      if (missingChains.length === 0) return;

      try {
        await createWaasWalletAccounts({ chains: missingChains });
      } catch (error) {
        // Nothing awaits an event listener, so an uncaught rejection here is
        // silent and the UI waits forever for a wallet that never arrives.
        console.error("Embedded wallet creation failed", error);
      }
    },
  });

  return null;
}

/**
 * `QueryClientProvider` must sit outside `DynamicProvider`: every hook in
 * `@dynamic-labs-sdk/react-hooks` is built on TanStack Query.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DynamicProvider client={dynamicClient}>
        <WaasBootstrap />
        {children}
      </DynamicProvider>
    </QueryClientProvider>
  );
}
