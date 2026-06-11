/**
 * App providers (Dynamic JS SDK).
 *
 * Wraps the app in DynamicProvider and exposes a small wallet context:
 *  - the user's embedded EVM wallet account (created on demand, never duplicated),
 *  - a `delegate()` action that grants the agent signing access
 *    (delegateWaasKeyShares → fires the wallet.delegation.created webhook),
 *  - login/logout state.
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  completeSocialAuthentication,
  detectOAuthRedirect,
  getWalletAccounts,
  isSignedIn,
  logout,
  onEvent,
} from "@dynamic-labs-sdk/client";
import {
  createWaasWalletAccounts,
  delegateWaasKeyShares,
} from "@dynamic-labs-sdk/client/waas";
import type { EvmWalletAccount } from "@dynamic-labs-sdk/evm";
import {
  DynamicProvider,
  useUser,
  useWalletAccounts,
} from "@dynamic-labs-sdk/react-hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { dynamicClient } from "./dynamic-client";

/** Narrow a wallet account to EVM. */
const isEvm = (a: { chain: string }): a is EvmWalletAccount => a.chain === "EVM";

const queryClient = new QueryClient();

interface WalletContextValue {
  evmAccount: EvmWalletAccount | null;
  loggedIn: boolean;
  delegated: boolean;
  busy: boolean;
  ensureEvmWallet: () => Promise<void>;
  delegate: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>({
  evmAccount: null,
  loggedIn: false,
  delegated: false,
  busy: false,
  ensureEvmWallet: async () => {},
  delegate: async () => {},
  disconnect: async () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

const delegatedKey = (address: string) => `agent-delegated:${address.toLowerCase()}`;

function InnerProviders({ children }: { children: ReactNode }) {
  const loggedIn = useUser().data != null;
  const evmAccount = useWalletAccounts().data?.find(isEvm) ?? null;
  const [delegated, setDelegated] = useState(false);
  const [busy, setBusy] = useState(false);

  // Sync the delegation flag: start from localStorage (instant), then confirm
  // against the server so a returning user is never stuck on the "Authorize"
  // screen when their share is already stored in Supabase.
  useEffect(() => {
    if (!evmAccount) {
      setDelegated(false);
      return;
    }
    const cached =
      typeof window !== "undefined" &&
      localStorage.getItem(delegatedKey(evmAccount.address)) === "1";
    setDelegated(cached);

    // Always verify against the server — localStorage can be stale (cleared,
    // different browser) even when the delegation is still active server-side.
    // AbortController prevents a stale response from a previous account from
    // overwriting the current account's state if evmAccount changes mid-flight.
    const address = evmAccount.address;
    const controller = new AbortController();
    fetch(`/api/delegation-status?address=${encodeURIComponent(address)}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.delegated) {
          if (typeof window !== "undefined") {
            localStorage.setItem(delegatedKey(address), "1");
          }
          setDelegated(true);
        }
      })
      .catch(() => {/* aborted or network error — keep whatever localStorage said */});
    return () => controller.abort();
  }, [evmAccount]);

  // Create the embedded EVM wallet only if the signed-in user has none yet.
  const ensureEvmWallet = useCallback(async () => {
    try {
      if (!isSignedIn(dynamicClient)) return;
      const accounts = getWalletAccounts(dynamicClient);
      if (accounts.some(isEvm)) return; // already has one — don't create another
      setBusy(true);
      await createWaasWalletAccounts({ chains: ["EVM"] }, dynamicClient);
    } catch (err) {
      console.error("ensureEvmWallet failed:", err);
    } finally {
      setBusy(false);
    }
  }, []);

  const delegate = useCallback(async () => {
    if (!evmAccount) return;
    setBusy(true);
    try {
      await delegateWaasKeyShares({ walletAccount: evmAccount }, dynamicClient);
      if (typeof window !== "undefined") {
        localStorage.setItem(delegatedKey(evmAccount.address), "1");
      }
      setDelegated(true);
    } finally {
      setBusy(false);
    }
  }, [evmAccount]);

  const disconnect = useCallback(async () => {
    await logout(dynamicClient);
    setDelegated(false);
  }, []);

  // Ensure a wallet exists shortly after sign-in.
  useEffect(() => {
    if (loggedIn && !evmAccount) void ensureEvmWallet();
  }, [loggedIn, evmAccount, ensureEvmWallet]);

  // Keep in sync if wallet accounts change.
  useEffect(() => {
    const unsub = onEvent(
      { event: "walletAccountsChanged", listener: () => void ensureEvmWallet() },
      dynamicClient
    );
    return () => unsub?.();
  }, [ensureEvmWallet]);

  // Complete social (OAuth) redirects.
  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      try {
        const url = new URL(window.location.href);
        if (await detectOAuthRedirect({ url }, dynamicClient)) {
          await completeSocialAuthentication({ url }, dynamicClient);
          await ensureEvmWallet();
          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [ensureEvmWallet]);

  return (
    <WalletContext.Provider
      value={{ evmAccount, loggedIn, delegated, busy, ensureEvmWallet, delegate, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DynamicProvider client={dynamicClient}>
        <InnerProviders>{children}</InnerProviders>
      </DynamicProvider>
    </QueryClientProvider>
  );
}
