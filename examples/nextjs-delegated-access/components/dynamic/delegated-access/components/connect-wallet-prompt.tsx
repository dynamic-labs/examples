"use client";

import { DynamicEmbeddedWidget } from "@dynamic-labs/sdk-react-core";

/**
 * Wallet connection prompt with embedded Dynamic widget
 *
 * Displayed when no wallet is connected. Uses Dynamic's embedded widget
 * to provide a seamless authentication experience directly in the UI.
 *
 * The widget styling is configured via cssOverrides in lib/providers.tsx.
 */
export default function ConnectWalletPrompt() {
  return (
    <div className="pt-8 pb-2 flex justify-center">
      <div className="w-full max-w-sm">
        <DynamicEmbeddedWidget background="none" />
      </div>
    </div>
  );
}
