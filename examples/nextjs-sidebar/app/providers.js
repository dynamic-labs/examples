"use client";

import { useEffect } from "react";
import { DynamicProvider, useEvent } from "@dynamic-labs-sdk/react-hooks";
import { completeSocialRedirect, detectSocialRedirectUrl } from "@dynamic-labs-sdk/client";
import { createWaasWalletAccounts, getChainsMissingWaasWalletAccounts } from "@dynamic-labs-sdk/client/waas";
import { dynamicClient, initDynamic } from "../lib/dynamic";

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
      } catch { }
    });
    return () => { cancelled = true; };
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

export default function Providers({ children }) {
  return (
    <DynamicProvider client={dynamicClient}>
      <DynamicBootstrap />
      <WalletBootstrap />
      {children}
    </DynamicProvider>
  );
}
