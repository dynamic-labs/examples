"use client";

import { useState } from "react";
import {
  Key,
  FileSignature,
  XCircle,
  Code2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChainEnum,
  useDynamicContext,
  useWalletDelegation,
} from "@/lib/dynamic";
import { authFetch } from "@/lib/dynamic/auth-fetch";
import { EcdsaKeygenResult } from "@dynamic-labs-wallet/node";
import ResponseDisplay from "./components/response-display";

interface DelegationResponse {
  success: boolean;
  data?: {
    address: string;
    walletId: string;
    walletApiKey: string;
    delegatedShare: typeof EcdsaKeygenResult;
  };
  error?: string;
}

interface SignMessageResponse {
  success: boolean;
  signature?: string;
  signer?: string;
  chain?: string;
  message?: string;
  duration?: string;
  error?: string;
}

type ActionType = "getKey" | "sign" | "revoke" | null;

export default function DelegatedAccessMethods() {
  const { user, primaryWallet } = useDynamicContext();
  const { revokeDelegation } = useWalletDelegation();

  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [lastAction, setLastAction] = useState<ActionType>(null);
  const [message, setMessage] = useState("Hello, World!");

  function clearResult() {
    setResult("");
    setError(null);
    setLastAction(null);
  }

  async function handleRevokeDelegation(address: string) {
    try {
      setIsLoading(true);
      setActiveAction("revoke");
      setError(null);
      setResult("");

      await revokeDelegation([
        { accountAddress: address, chainName: ChainEnum.Evm },
      ]);

      setResult("Delegation revoked successfully");
      setLastAction("revoke");
    } catch (err) {
      console.error("Revocation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to revoke delegation"
      );
      setLastAction("revoke");
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  }

  async function handleGetDelegatedKey() {
    if (!primaryWallet?.address || !primaryWallet?.chain) {
      setError("Wallet not properly connected. Please reconnect.");
      setLastAction("getKey");
      return;
    }

    try {
      setIsLoading(true);
      setActiveAction("getKey");
      setError(null);
      setResult("");

      const response = await authFetch(
        `/api/delegation?address=${encodeURIComponent(
          primaryWallet.address
        )}&chain=${encodeURIComponent(primaryWallet.chain)}`
      );
      const data: DelegationResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to fetch delegation");
        setLastAction("getKey");
        return;
      }

      setResult(JSON.stringify(data.data, null, 2));
      setLastAction("getKey");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch delegation"
      );
      setLastAction("getKey");
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  }

  async function handleSignMessage() {
    if (!user?.userId || !primaryWallet?.chain || !primaryWallet?.address) {
      setError("Please ensure you are logged in and wallet is connected.");
      setLastAction("sign");
      return;
    }

    if (!message.trim()) {
      setError("Please enter a message to sign");
      setLastAction("sign");
      return;
    }

    try {
      setIsLoading(true);
      setActiveAction("sign");
      setError(null);
      setResult("");

      const response = await authFetch(`/api/delegation/sign`, {
        method: "POST",
        body: JSON.stringify({
          address: primaryWallet.address,
          chain: primaryWallet.chain,
          message: message.trim(),
        }),
      });

      const data: SignMessageResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to sign message");
        setLastAction("sign");
        return;
      }

      setResult(JSON.stringify(data, null, 2));
      setLastAction("sign");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign message");
      setLastAction("sign");
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-dynamic" />
            <h3 className="font-semibold">Delegated Access Methods</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Test server-side wallet operations using your delegated key
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Get Delegated Key */}
          <MethodCard
            icon={<Key className="w-4 h-4 text-dynamic" />}
            iconBg="bg-dynamic/10"
            title="Retrieve Delegated Key"
            description="Fetch the encrypted delegation share from the server. This is the key material your backend uses for signing."
          >
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGetDelegatedKey}
              disabled={!primaryWallet?.address || isLoading}
            >
              {isLoading && activeAction === "getKey" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                "Get Delegated Key"
              )}
            </Button>
            {lastAction === "getKey" && (
              <ResponseDisplay
                result={result}
                error={error}
                onClear={clearResult}
              />
            )}
          </MethodCard>

          {/* Sign Message */}
          <MethodCard
            icon={<FileSignature className="w-4 h-4 text-dynamic" />}
            iconBg="bg-dynamic/15"
            title="Sign Message (Server-Side)"
            description="Sign a message using the delegated key on the server. This demonstrates server-side signing without user interaction."
          >
            <div className="space-y-2">
              <label
                htmlFor="message-input"
                className="text-xs font-medium text-muted-foreground"
              >
                Message to Sign
              </label>
              <input
                id="message-input"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-dynamic focus:border-transparent"
                placeholder="Enter message to sign"
                disabled={isLoading}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignMessage}
                disabled={!user?.userId || !message.trim() || isLoading}
              >
                {isLoading && activeAction === "sign" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : (
                  "Sign Message"
                )}
              </Button>
            </div>
            {lastAction === "sign" && (
              <ResponseDisplay
                result={result}
                error={error}
                onClear={clearResult}
              />
            )}
          </MethodCard>

          {/* Revoke Delegation */}
          <div className="rounded-lg border border-red-200 dark:border-red-900/50 p-4 space-y-3 bg-red-50/50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-red-700 dark:text-red-400">
                  Revoke Delegation
                </h4>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                  Remove server access to your wallet. This invalidates the
                  delegated key share immediately.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950"
              onClick={() => handleRevokeDelegation(primaryWallet?.address!)}
              disabled={!user?.userId || isLoading || !primaryWallet?.address}
            >
              {isLoading && activeAction === "revoke" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Delegation"
              )}
            </Button>
            {lastAction === "revoke" && (
              <ResponseDisplay
                result={result}
                error={error}
                onClear={clearResult}
              />
            )}
          </div>
        </div>
      </div>

      {/* User Warning */}
      {!user?.userId && (
        <div className="rounded-xl border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-950/30 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Authentication Required
              </h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Please log in with Dynamic to access delegation methods.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Method Card Component
function MethodCard({
  icon,
  iconBg,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dynamic/20 p-4 space-y-3 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
