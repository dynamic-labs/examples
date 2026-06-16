"use client";

/**
 * DynamicMethods
 *
 * A playground component for testing Dynamic SDK methods.
 * Displays method results as formatted JSON in a response panel.
 *
 * Available methods:
 * - Fetch User: Shows the current user object
 * - Fetch Wallet Accounts: Shows all embedded wallet accounts
 * - Sign Message: Signs a test message with the EVM embedded wallet
 */

import { Check, Copy } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser, useWalletAccounts, useInitStatus } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import DynamicWidget from "./dynamic-widget";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

export default function DynamicMethods() {
  // Dynamic SDK hooks
  const user = useUser();
  const accounts = useWalletAccounts();
  const initStatus = useInitStatus();
  const isLoggedIn = user !== null;
  const evmAccount = accounts.find(isEvmWalletAccount);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Redirect to home if not logged in (after SDK loads)
  useEffect(() => {
    if (initStatus === "finished" && !isLoggedIn) redirect("/");
  }, [initStatus, isLoggedIn]);

  // Update loading state based on SDK readiness
  useEffect(() => {
    if (initStatus === "finished" && isLoggedIn) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [initStatus, isLoggedIn]);

  /**
   * Safely stringifies objects, handling circular references.
   */
  const safeStringify = (obj: unknown): string => {
    const seen = new WeakSet();
    return JSON.stringify(
      obj,
      (_, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return "[Circular]";
          seen.add(value);
        }
        return value;
      },
      2
    );
  };

  /** Clears the result panel */
  function clearResult() {
    setResult("");
    setError(null);
  }

  /** Displays the current user object */
  function showUser() {
    try {
      setResult(safeStringify(user));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to stringify user data"
      );
    }
  }

  /** Displays all embedded wallet accounts linked to the user */
  function showWalletAccounts() {
    try {
      setResult(safeStringify(accounts));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to stringify wallet data"
      );
    }
  }

  /** Signs a test message using the EVM embedded wallet */
  async function signEvmMessage() {
    if (!evmAccount) return;
    try {
      setIsLoading(true);
      const { signMessage } = await import("@dynamic-labs-sdk/client");
      const { signature } = await signMessage({ walletAccount: evmAccount, message: "Hello World" });
      setResult(safeStringify(signature));
      setError(null);
    } catch (err) {
      setResult(
        safeStringify({
          error: err instanceof Error ? err.message : "Unknown error occurred",
        })
      );
    } finally {
      setIsLoading(false);
    }
  }

  /** Copies result to clipboard */
  function copyToClipboard() {
    const textToCopy = error ? String(error) : result;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="w-full px-4 py-6">
      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-6">
        {/* Response Panel */}
        <div className="order-2 md:order-1 rounded-md border bg-black/5 dark:bg-white/5 p-4 flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-wide opacity-70 text-muted-foreground">
              Response
            </h2>
            {(result || error) && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={clearResult}>
                  Clear
                </Button>
                <Button variant="outline" onClick={copyToClipboard}>
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
          <div className="relative w-full h-full">
            {error ? (
              <pre className="font-mono text-sm leading-6 whitespace-pre-wrap wrap-break-word text-red-600">
                {error}
              </pre>
            ) : result ? (
              <div className="max-h-[70vh] overflow-auto scrollbar-hide">
                <pre className="font-mono text-sm leading-6 wrap-break-word whitespace-pre-wrap">
                  {result}
                </pre>
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center font-mono text-sm opacity-60">
                Run a method from the right to view JSON here.
              </div>
            )}
          </div>
        </div>

        {/* Methods Panel */}
        <div className="order-1 md:order-2">
          <div className="sticky flex flex-col gap-3">
            {/* Auth widget or loading state */}
            {!isLoading ? (
              <DynamicWidget />
            ) : (
              <Skeleton className="h-[40px] w-full bg-[#f7f7f9]" />
            )}

            {/* User/Wallet Methods */}
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={showUser}
            >
              Fetch User
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={showWalletAccounts}
            >
              Fetch Wallet Accounts
            </Button>

            {/* EVM Wallet Methods */}
            {evmAccount && (
              <div className="pt-2">
                <div className="text-xs uppercase tracking-wide opacity-60 mb-2">
                  EVM Wallet Methods
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={signEvmMessage}
                    className="cursor-pointer"
                  >
                    Sign Message
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
