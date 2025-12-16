"use client";

/**
 * DynamicMethods
 *
 * A playground component for testing Dynamic SDK methods.
 * Displays method results as formatted JSON in a response panel.
 *
 * Available methods:
 * - Fetch User: Shows the current user object
 * - Fetch User Wallets: Shows all wallets linked to the user
 * - Fetch PublicClient: Gets viem PublicClient (Ethereum only)
 * - Fetch WalletClient: Gets viem WalletClient (Ethereum only)
 * - Sign Message: Signs a test message with the wallet (Ethereum only)
 */

import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { Check, Copy } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useDynamicContext,
  useIsLoggedIn,
  useUserWallets,
} from "@/lib/dynamic";
import DynamicWidget from "./dynamic-widget";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

export default function DynamicMethods() {
  // Dynamic SDK hooks
  const isLoggedIn = useIsLoggedIn();
  const { sdkHasLoaded, primaryWallet, user } = useDynamicContext();
  const userWallets = useUserWallets();

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Redirect to home if not logged in (after SDK loads)
  useEffect(() => {
    if (sdkHasLoaded && !isLoggedIn) redirect("/");
  }, [sdkHasLoaded, isLoggedIn]);

  /**
   * Safely stringifies objects, handling circular references.
   * Dynamic SDK objects often have circular refs that break JSON.stringify.
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

  // Update loading state based on SDK readiness
  useEffect(() => {
    if (sdkHasLoaded && isLoggedIn && primaryWallet) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [sdkHasLoaded, isLoggedIn, primaryWallet]);

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

  /** Displays all wallets linked to the user */
  function showUserWallets() {
    try {
      setResult(safeStringify(userWallets));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to stringify wallet data"
      );
    }
  }

  /** Fetches the viem PublicClient from the Ethereum wallet */
  async function fetchEthereumPublicClient() {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;
    try {
      setIsLoading(true);
      const client = await primaryWallet.getPublicClient();
      setResult(safeStringify(client));
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

  /** Fetches the viem WalletClient from the Ethereum wallet */
  async function fetchEthereumWalletClient() {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;
    try {
      setIsLoading(true);
      const client = await primaryWallet.getWalletClient();
      setResult(safeStringify(client));
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

  /** Signs a test message using the Ethereum wallet */
  async function signEthereumMessage() {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;
    try {
      setIsLoading(true);
      const signature = await primaryWallet.signMessage("Hello World");
      setResult(safeStringify(signature));
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
            {/* Dynamic Widget or Loading State */}
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
              onClick={showUserWallets}
            >
              Fetch User Wallets
            </Button>

            {/* Ethereum-specific Methods */}
            {primaryWallet && isEthereumWallet(primaryWallet) && (
              <div className="pt-2">
                <div className="text-xs uppercase tracking-wide opacity-60 mb-2">
                  Ethereum Wallet Methods
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={fetchEthereumPublicClient}
                    className="cursor-pointer"
                  >
                    Fetch PublicClient
                  </Button>
                  <Button
                    variant="outline"
                    onClick={fetchEthereumWalletClient}
                    className="cursor-pointer"
                  >
                    Fetch WalletClient
                  </Button>
                  <Button
                    variant="outline"
                    onClick={signEthereumMessage}
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
