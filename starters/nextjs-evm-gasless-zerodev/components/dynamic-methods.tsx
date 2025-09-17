"use client";
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { Copy, Check } from "lucide-react";
import {
  useDynamicContext,
  useIsLoggedIn,
  useUserWallets,
} from "@/lib/dynamic";
import DynamicWidget from "./dynamic/dynamic-widget";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { isEthereumWallet } from "@dynamic-labs/ethereum";

export default function DynamicMethods() {
  const isLoggedIn = useIsLoggedIn();
  const { sdkHasLoaded, primaryWallet, user } = useDynamicContext();
  const userWallets = useUserWallets();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sdkHasLoaded && !isLoggedIn) redirect("/");
  }, [sdkHasLoaded, isLoggedIn]);

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

  useEffect(() => {
    if (sdkHasLoaded && isLoggedIn && primaryWallet) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [sdkHasLoaded, isLoggedIn, primaryWallet]);

  function clearResult() {
    setResult("");
    setError(null);
  }

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

  async function fetchEthereumPublicClient() {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;
    try {
      setIsLoading(true);
      const result = await primaryWallet.getPublicClient();
      setResult(safeStringify(result));
    } catch (error) {
      setResult(
        safeStringify({
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        })
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchEthereumWalletClient() {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;
    try {
      setIsLoading(true);
      const result = await primaryWallet.getWalletClient();
      setResult(safeStringify(result));
    } catch (error) {
      setResult(
        safeStringify({
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        })
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchEthereumMessage() {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;
    try {
      setIsLoading(true);
      const result = await primaryWallet.signMessage("Hello World");
      setResult(safeStringify(result));
    } catch (error) {
      setResult(
        safeStringify({
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        })
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full px-4 py-6">
      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-6">
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
                <Button
                  variant="outline"
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
            )}
          </div>
          <div className="relative w-full h-full">
            {error ? (
              <pre className="font-mono text-sm leading-6 whitespace-pre-wrap break-words text-red-600">
                {error}
              </pre>
            ) : result ? (
              <div className="max-h-[70vh] overflow-auto scrollbar-hide">
                <pre className="font-mono text-sm leading-6 break-words whitespace-pre-wrap">
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

        <div className="order-1 md:order-2">
          <div className="sticky flex flex-col gap-3">
            {!isLoading ? (
              <DynamicWidget />
            ) : (
              <Skeleton className="h-[40px] w-full bg-[#f7f7f9]" />
            )}
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
            {primaryWallet && isEthereumWallet(primaryWallet) && (
              <div className="pt-2">
                <div className="text-xs uppercase tracking-wide opacity-60 mb-2">
                  Wallet Methods
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
                    onClick={fetchEthereumMessage}
                    className="cursor-pointer"
                  >
                    Fetch Message
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
