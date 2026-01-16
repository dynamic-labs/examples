"use client";

import { useState } from "react";
import {
  Key,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChainEnum,
  useDynamicContext,
  useWalletDelegation,
} from "@/lib/dynamic";

/**
 * DelegationManagement - Delegation with Custom UI (No Modal)
 *
 * This component demonstrates programmatic delegation without Dynamic's modal:
 * - delegateKeyShares() - Direct delegation without showing any UI
 * - Best for: Custom delegation flows where you want full UI control
 */
export default function DelegationManagement() {
  const { primaryWallet } = useDynamicContext();
  const { delegateKeyShares, getWalletsDelegatedStatus } =
    useWalletDelegation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get delegation status for all wallets from the SDK
  // This is the source of truth for which wallets are eligible for delegation
  const allWalletStatuses = getWalletsDelegatedStatus();

  // Wallets with status "pending" are eligible for delegation
  const pendingWallets = allWalletStatuses.filter(
    (wallet) => wallet.status === "pending"
  );

  // Check if primary wallet is in the delegation status list (eligible)
  const primaryWalletStatus = primaryWallet
    ? allWalletStatuses.find(
        (w) => w.address.toLowerCase() === primaryWallet.address.toLowerCase()
      )
    : null;

  const isPrimaryEligible = !!primaryWalletStatus;
  const isPrimaryDelegated = primaryWalletStatus?.status === "delegated";
  const isPrimaryPending = primaryWalletStatus?.status === "pending";

  // Delegate primary wallet only
  const handleDelegatePrimary = async () => {
    if (!primaryWallet || !primaryWalletStatus) {
      setError("No eligible primary wallet found");
      return;
    }

    if (!isPrimaryPending) {
      setError("Primary wallet is not pending delegation");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await delegateKeyShares([
        {
          chainName: primaryWalletStatus.chain as ChainEnum,
          accountAddress: primaryWalletStatus.address,
        },
      ]);

      setSuccess("Primary wallet delegated successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to delegate primary wallet";
      setError(errorMessage);
      console.error("Delegation failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delegate all pending wallets
  const handleDelegateAll = async () => {
    if (pendingWallets.length === 0) {
      setError("No pending wallets found");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const walletsToDelegate = pendingWallets.map((wallet) => ({
        chainName: wallet.chain as ChainEnum,
        accountAddress: wallet.address,
      }));

      await delegateKeyShares(walletsToDelegate);

      setSuccess(`${pendingWallets.length} wallet(s) delegated successfully!`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delegate wallets";
      setError(errorMessage);
      console.error("Delegation failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="w-full">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Method Explanation */}
          <div className="rounded-lg border border-muted p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Key className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">delegateKeyShares()</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Delegates key shares programmatically without any UI. Build
                  your own consent flow and call this when ready.
                </p>
              </div>
            </div>

            {/* What happens */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">
                When called, this will:
              </p>
              <div className="space-y-1.5">
                <FlowStep number={1} text="Generate MPC key share silently" />
                <FlowStep number={2} text="Encrypt and store share on server" />
                <FlowStep number={3} text="Return control to your code" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Delegate Primary Only */}
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDelegatePrimary}
                disabled={isLoading || !isPrimaryPending}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Delegating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {!isPrimaryEligible
                      ? "Not Eligible"
                      : isPrimaryDelegated
                      ? "Already Delegated"
                      : "Primary Only"}
                  </span>
                )}
              </Button>

              {/* Delegate All */}
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDelegateAll}
                disabled={isLoading || pendingWallets.length === 0}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Delegating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    All ({pendingWallets.length})
                  </span>
                )}
              </Button>
            </div>

            {/* Feedback Messages */}
            {error && (
              <FeedbackMessage
                type="error"
                message={error}
                onClear={clearMessages}
              />
            )}
            {success && (
              <FeedbackMessage
                type="success"
                message={success}
                onClear={clearMessages}
              />
            )}
          </div>

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
      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
        {number}
      </div>
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function FeedbackMessage({
  type,
  message,
  onClear,
}: {
  type: "error" | "success";
  message: string;
  onClear: () => void;
}) {
  const isError = type === "error";
  return (
    <div
      className={`rounded-lg p-3 ${
        isError
          ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
          : "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {isError ? (
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          )}
          <p
            className={`text-xs ${
              isError
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {message}
          </p>
        </div>
        <button
          onClick={onClear}
          className={`text-xs underline ${
            isError
              ? "text-red-500 hover:text-red-700"
              : "text-green-500 hover:text-green-700"
          }`}
        >
          Dismiss
        </button>
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
        <code className="text-muted-foreground">{`const { delegateKeyShares } = useWalletDelegation();

// Delegate without showing any Dynamic UI
const handleDelegate = async () => {
  try {
    await delegateKeyShares([
      { chainName: ChainEnum.Evm, accountAddress: '0x...' }
    ]);
    console.log('Delegation completed!');
  } catch (error) {
    console.error('Delegation failed:', error);
  }
};

// Or delegate all pending wallets at once
await delegateKeyShares();`}</code>
      </pre>
    </div>
  );
}
