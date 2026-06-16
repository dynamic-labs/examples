"use client";

import DynamicButton from "@/components/dynamic/dynamic-widget";

/**
 * Wallet connection prompt
 *
 * Displayed when no wallet is connected. Uses the DynamicButton component
 * to provide an authentication entry point directly in the UI.
 */
export default function ConnectWalletPrompt() {
  return (
    <div className="pt-8 pb-2 flex justify-center">
      <div className="w-full max-w-sm">
        <DynamicButton />
      </div>
    </div>
  );
}
