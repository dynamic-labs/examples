"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useDynamicContext,
  useWalletDelegation,
} from "@dynamic-labs/sdk-react-core";

export default function DelegatedAccessInit() {
  const { primaryWallet } = useDynamicContext();
  const { initDelegationProcess } = useWalletDelegation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitDelegation = async () => {
    try {
      if (!primaryWallet) {
        setError("Primary wallet not found. Please connect your wallet.");
        return;
      }

      setIsLoading(true);
      setError(null);

      await initDelegationProcess({ wallets: [primaryWallet] });
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
    <div className="w-full space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-4">Delegation Initiation</h3>
        <Button
          onClick={handleInitDelegation}
          className="w-full"
          disabled={isLoading || !primaryWallet}
        >
          {isLoading ? "Initializing..." : "Enable Delegation"}
        </Button>
        {error && (
          <div className="mt-3 rounded-md bg-red-50 dark:bg-red-950/20 p-3">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
