"use client";

import { createContext, useContext, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DynamicProvider, useOnEvent, useUser, useGetWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import {
  createWaasWalletAccounts,
  getChainsMissingWaasWalletAccounts,
  isWaasWalletAccount,
} from "@dynamic-labs-sdk/client/waas";
import type { WalletAccount } from "@dynamic-labs-sdk/client";
import { isEvmWalletAccount, type EvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { CHAIN_ID } from "@/lib/constants";
import { dynamicClient } from "@/lib/dynamic";

interface WalletContextValue {
  evmAccount: EvmWalletAccount | null;
  loggedIn: boolean;
  /** Base only — this example has no network selector. */
  chainId: number;
}

const WalletContext = createContext<WalletContextValue>({
  evmAccount: null,
  loggedIn: false,
  chainId: CHAIN_ID,
});

export function useWallet() {
  return useContext(WalletContext);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Matches the Moonwell app's 5s cadence for on-chain reads. Window-focus
      // refetching is deliberately left on: polling pauses while the tab is in
      // the background, so without it a user who switches away during a
      // transaction comes back to stale balances.
      staleTime: 1000 * 5,
    },
  },
});

/**
 * Embedded (WaaS) wallet creation is not automatic — it has to be triggered
 * after authentication. `getChainsMissingWaasWalletAccounts()` is the correct
 * signal: guarding on `accounts.length === 0` can read a stale non-empty list
 * immediately after auth and silently skip creation.
 *
 * `useOnEvent` (never a raw `onEvent` call in a component) deduplicates the
 * subscription and cleans it up on unmount, including under Strict Mode.
 */
function WaasBootstrap() {
  useOnEvent({
    event: "userChanged",
    listener: async (user) => {
      if (!user) return;
      const missingChains = getChainsMissingWaasWalletAccounts();
      if (missingChains.length === 0) return;
      try {
        await createWaasWalletAccounts({ chains: missingChains });
      } catch (error) {
        // Nothing awaits an event listener, so an uncaught rejection here is
        // silent — and the UI would wait forever for a wallet that never
        // arrives. Signing out and back in retries the creation.
        console.error("Embedded wallet creation failed", error);
      }
    },
  });
  return null;
}

function WalletContextProvider({ children }: { children: ReactNode }) {
  const { data: user } = useUser();
  const { data: accounts = [] } = useGetWalletAccounts();
  // `useGetWalletAccounts` is typed as the chain-agnostic base account, while
  // the type guard is declared over the chain-specific `WalletAccount` union.
  const evmAccounts = (accounts as WalletAccount[]).filter(isEvmWalletAccount);

  // Prefer the embedded wallet. `addEvmExtension()` also registers EIP-6963
  // discovery, so an external browser wallet can appear in this list — and only
  // the WaaS provider signs locally. Picking the first EVM account instead would
  // hand transactions to a provider that just forwards `eth_sendTransaction` to
  // a public RPC, which has no keys and rejects it.
  const evmAccount =
    evmAccounts.find((walletAccount) => isWaasWalletAccount({ walletAccount })) ??
    evmAccounts[0] ??
    null;

  return (
    <WalletContext.Provider
      value={{ evmAccount, loggedIn: !!user, chainId: CHAIN_ID }}
    >
      {children}
    </WalletContext.Provider>
  );
}

/**
 * `QueryClientProvider` must sit OUTSIDE `DynamicProvider`: every hook in
 * `@dynamic-labs-sdk/react-hooks` is built on TanStack Query.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DynamicProvider client={dynamicClient}>
        <WaasBootstrap />
        <WalletContextProvider>{children}</WalletContextProvider>
      </DynamicProvider>
    </QueryClientProvider>
  );
}
