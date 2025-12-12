"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChainEnum,
  useDynamicContext,
  useWalletDelegation,
} from "@/lib/dynamic";
import { EcdsaKeygenResult } from "@dynamic-labs-wallet/node";

interface DelegationResponse {
  success: boolean;
  data?: {
    address: string;
    walletId: string;
    walletApiKey: string;
    delegatedShare: EcdsaKeygenResult;
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

export default function DelegatedAccessMethods() {
  const { user, primaryWallet } = useDynamicContext();
  const { revokeDelegation } = useWalletDelegation();

  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Hello, World!");

  function clearResult() {
    setResult("");
    setError(null);
  }

  async function handleRevokeDelegation(address: string) {
    try {
      setIsLoading(true);
      setError(null);
      console.log("revoking delegation for address", address);
      const response = await revokeDelegation([
        {
          accountAddress: address,
          chainName: ChainEnum.Evm,
          status: "delegated",
        },
      ]);

      console.log(response);

      setError(null);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to revoke delegation"
      );
      setResult("");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGetDelegatedKey() {
    if (!primaryWallet?.address) {
      setError("Wallet address not found. Please connect your wallet.");
      return;
    }

    if (!primaryWallet?.chain) {
      setError(
        "Wallet chain not available. Please ensure your wallet is connected"
      );
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/delegation?address=${encodeURIComponent(
          primaryWallet.address
        )}&chain=${encodeURIComponent(primaryWallet.chain)}`
      );
      const data: DelegationResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to fetch delegation");
        setResult("");
        return;
      }

      setResult(JSON.stringify(data.data, null, 2));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch delegation"
      );
      setResult("");
    } finally {
      setIsLoading(false);
    }
  }

  async function signMessage() {
    if (!user?.userId) {
      setError("User ID not found. Please log in.");
      return;
    }

    if (!message.trim()) {
      setError("Please enter a message to sign");
      return;
    }

    if (!primaryWallet?.chain) {
      setError(
        "Wallet chain not available. Please ensure your wallet is connected"
      );
      return;
    }

    if (!primaryWallet?.address) {
      setError(
        "Wallet address not available. Please ensure your wallet is connected"
      );
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/delegation/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: primaryWallet.address,
          chain: primaryWallet.chain,
          message: message.trim(),
        }),
      });

      const data: SignMessageResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to sign message");
        setResult("");
        return;
      }

      setResult(JSON.stringify(data, null, 2));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign message");
      setResult("");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <span>Delegated Access Methods</span>
        </h3>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleGetDelegatedKey}
            disabled={
              !primaryWallet?.address || !primaryWallet?.chain || isLoading
            }
          >
            Get Delegated Key
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleRevokeDelegation(primaryWallet?.address!)}
            disabled={!user?.userId || isLoading || !primaryWallet?.address}
          >
            Revoke Delegation
          </Button>

          <div className="space-y-2">
            <label
              htmlFor="message-input"
              className="text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              Message to Sign
            </label>
            <input
              id="message-input"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter message to sign"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={signMessage}
              disabled={
                !user?.userId ||
                !message.trim() ||
                !primaryWallet?.chain ||
                isLoading
              }
            >
              Sign Message
            </Button>
          </div>
        </div>
      </div>

      {(result || error) && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Response</h4>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearResult}>
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const textToCopy = error ? String(error) : result;
                  navigator.clipboard.writeText(textToCopy).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  });
                }}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {error ? (
            <div className="rounded-md bg-red-50 dark:bg-red-950/20 p-3">
              <pre className="font-mono text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                {error}
              </pre>
            </div>
          ) : (
            <div className="rounded-md bg-gray-50 dark:bg-gray-900 p-3 max-h-96 overflow-auto">
              <pre className="font-mono text-xs whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}
        </div>
      )}

      {!user?.userId && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ User ID not available. Please ensure you're logged in with
            Dynamic.
          </p>
        </div>
      )}
    </div>
  );
}
