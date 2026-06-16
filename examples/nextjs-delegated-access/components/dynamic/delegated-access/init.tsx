"use client";

import { useState } from "react";
import { Lock, Zap, Loader2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { delegateWaasKeyShares } from "@dynamic-labs-sdk/client/waas";
import { dynamicClient } from "@/lib/dynamic";

/**
 * DelegatedAccessInit - Delegate the primary EVM wallet key share
 *
 * This component demonstrates using delegateWaasKeyShares() which:
 * - Silently delegates the MPC key share to the server
 * - Handles key generation and storage automatically
 * - Best for: Quick integration with minimal custom UI work
 */
export default function DelegatedAccessInit() {
  const accounts = useWalletAccounts();
  const primaryWallet = accounts.find(isEvmWalletAccount) ?? null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitDelegation = async () => {
    if (!primaryWallet) {
      setError("Primary wallet not found. Please connect your wallet.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await delegateWaasKeyShares({ walletAccount: primaryWallet }, dynamicClient);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Delegation failed";
      setError(errorMessage);
      console.error("Delegation failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Method Explanation */}
          <div className="rounded-lg border border-dynamic/20 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-dynamic/10 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-dynamic" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">
                  delegateWaasKeyShares()
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Delegates the MPC key share to the server programmatically.
                  Handles key generation and encrypted storage automatically.
                </p>
              </div>
            </div>

            {/* What happens */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">
                When triggered, the delegation will:
              </p>
              <div className="space-y-1.5">
                <FlowStep number={1} text="Generate and encrypt MPC key share" />
                <FlowStep number={2} text="Store encrypted share on server" />
                <FlowStep number={3} text="Enable server-side signing" />
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleInitDelegation}
              className="w-full bg-dynamic hover:bg-dynamic/90 text-white"
              disabled={isLoading || !primaryWallet}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Delegating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Delegate Key Share
                </span>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && <ErrorMessage message={error} />}

          {/* Code Example */}
          <CodeExample />
        </div>
      </div>
    </div>
  );
}

function FlowStep({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-full bg-dynamic/15 flex items-center justify-center text-xs font-bold text-dynamic shrink-0">
        {number}
      </div>
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
        <p className="text-xs text-red-600 dark:text-red-400">{message}</p>
      </div>
    </div>
  );
}

function CodeExample() {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-xs font-medium text-muted-foreground">
          Usage Example
        </h4>
      </div>
      <pre className="text-xs bg-background rounded-lg p-3 overflow-x-auto border">
        <code className="text-muted-foreground">{`import { delegateWaasKeyShares } from "@dynamic-labs-sdk/client/waas";
import { dynamicClient } from "@/lib/dynamic";

// Delegates the key share to the server
const handleDelegate = async (walletAccount) => {
  try {
    await delegateWaasKeyShares({ walletAccount }, dynamicClient);
    console.log('Delegation completed!');
  } catch (error) {
    console.error('Delegation failed:', error);
  }
};`}</code>
      </pre>
    </div>
  );
}
