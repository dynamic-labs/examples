"use client";

import { useState } from "react";
import { Lock, Zap, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDynamicContext,
  useWalletDelegation,
} from "@dynamic-labs/sdk-react-core";

const INIT_STEPS = [
  {
    number: 1,
    title: "Secure Key Generation",
    description: "A secure MPC key share will be created and encrypted",
    bgClass: "bg-dynamic/15",
  },
  {
    number: 2,
    title: "Server Storage",
    description: "Your encrypted share is stored securely on the server",
    bgClass: "bg-dynamic/20",
  },
  {
    number: 3,
    title: "Ready to Sign",
    description: "Server can now sign transactions on your behalf",
    bgClass: "bg-dynamic/25",
  },
];

export default function DelegatedAccessInit() {
  const { primaryWallet } = useDynamicContext();
  const { initDelegationProcess } = useWalletDelegation();

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
    <div className="w-full">
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-dynamic/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-dynamic/15">
              <Lock className="w-5 h-5 text-dynamic" />
            </div>
            <div>
              <h3 className="font-semibold">Enable Delegation</h3>
              <p className="text-xs text-muted-foreground">
                One-time setup to allow server-side signing
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Steps */}
          <div className="space-y-3">
            {INIT_STEPS.map((step) => (
              <InitStep key={step.number} {...step} />
            ))}
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
                Initializing Delegation...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Enable Delegation
              </span>
            )}
          </Button>

          {/* Error Display */}
          {error && <ErrorMessage message={error} />}
        </div>
      </div>
    </div>
  );
}

function InitStep({
  number,
  title,
  description,
  bgClass,
}: {
  number: number;
  title: string;
  description: string;
  bgClass: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${bgClass} text-dynamic`}
      >
        {number}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
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
