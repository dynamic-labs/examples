"use client";

import { dynamicClient, initDynamic } from "@/lib/dynamic";
import {
  completeSocialRedirect,
  detectSocialRedirectUrl,
} from "@dynamic-labs-sdk/client";
import {
  createWaasWalletAccounts,
  getChainsMissingWaasWalletAccounts,
} from "@dynamic-labs-sdk/client/waas";
import { DynamicProvider, useEvent } from "@dynamic-labs-sdk/react-hooks";
import { useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";

/**
 * Initializes the client, then completes the Google OAuth redirect (returns
 * with ?dynamicOauthCode=…) so the user is hydrated after social sign-in.
 */
function DynamicBootstrap() {
  useEffect(() => {
    let cancelled = false;
    initDynamic().then(async () => {
      if (cancelled || typeof globalThis.window === "undefined") return;
      try {
        const url = new URL(globalThis.location.href);
        if (await detectSocialRedirectUrl({ url })) {
          await completeSocialRedirect({ url });
          globalThis.history.replaceState({}, "", globalThis.location.pathname);
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

/**
 * Once a user signs in, create embedded wallets for any enabled chain that's
 * missing one — using getChainsMissingWaasWalletAccounts() rather than an
 * accounts.length check, which can be momentarily stale right after auth.
 */
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

/**
 * Application Providers
 *
 * Wraps the application with all necessary context providers:
 * - ThemeProvider: Handles light/dark mode theming
 * - DynamicProvider: Core Dynamic SDK provider for wallet authentication
 * - DynamicBootstrap: Initializes client and handles social OAuth redirects
 * - WalletBootstrap: Auto-creates embedded wallets after sign-in
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DynamicProvider client={dynamicClient}>
        <DynamicBootstrap />
        <WalletBootstrap />
        {children}
      </DynamicProvider>
    </ThemeProvider>
  );
}
