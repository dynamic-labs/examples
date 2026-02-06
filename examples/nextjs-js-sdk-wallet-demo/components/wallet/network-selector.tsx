"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNetworks } from "@/hooks/use-networks";
import { useActiveNetwork } from "@/hooks/use-active-network";
import { useWalletAccounts } from "@/hooks/use-wallet-accounts";
import { switchActiveNetwork, type WalletAccount } from "@/lib/dynamic-client";
import { getBaseWalletForAddress } from "@/lib/wallet-utils";

interface NetworkSelectorProps {
  walletAccount: WalletAccount;
  onNetworkChange?: () => void;
}

/**
 * Network selector dropdown for EVM wallets.
 *
 * When switching networks, all wallets with the same address
 * (base + ZeroDev) are updated to maintain consistency.
 */
export function NetworkSelector({
  walletAccount,
  onNetworkChange,
}: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { networks } = useNetworks();
  const { walletAccounts } = useWalletAccounts();

  // Use base wallet for network display (consistent source of truth)
  const baseWallet =
    getBaseWalletForAddress(walletAccount.address, walletAccounts) ||
    walletAccount;

  const { networkData, refetch: refetchNetwork } = useActiveNetwork(baseWallet);

  // Filter networks for wallet's chain
  const availableNetworks = networks.filter(
    (n) => n.chain === walletAccount.chain,
  );

  // Get all wallets for this address (to switch all of them)
  const walletsForAddress = walletAccounts.filter(
    (w) =>
      w.address.toLowerCase() === walletAccount.address.toLowerCase() &&
      w.chain === walletAccount.chain,
  );

  const handleSelectNetwork = async (networkId: string) => {
    if (networkId === networkData?.networkId) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Switch ALL wallets for this address (base + ZeroDev)
      await Promise.all(
        walletsForAddress.map((wallet) =>
          switchActiveNetwork({ networkId, walletAccount: wallet }).catch(
            () => {
              // Ignore failures (some wallets may not support all networks)
            },
          ),
        ),
      );

      await refetchNetwork();
      onNetworkChange?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to switch network";
      if (message.includes("unrecognized network")) {
        setError("Network not enabled in dashboard");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  if (availableNetworks.length <= 1) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="relative">
        {/* Backdrop to close dropdown */}
        {isOpen && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
            "bg-(--widget-bg) rounded-(--widget-radius)",
            "border border-(--widget-border)",
            "hover:bg-(--widget-row-hover) transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {networkData?.iconUrl && (
            <img
              src={networkData.iconUrl}
              alt={networkData.displayName}
              className="w-4 h-4 rounded"
            />
          )}
          <span className="text-(--widget-fg)">
            {networkData?.displayName || "Select Network"}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-(--widget-muted) transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {isOpen && (
          <div
            className={cn(
              "absolute top-full right-0 mt-1 z-10 min-w-full w-max",
              "bg-(--widget-bg) border border-(--widget-border)",
              "rounded-(--widget-radius) shadow-lg overflow-hidden",
            )}
          >
            {availableNetworks.map((network) => (
              <button
                key={network.networkId}
                type="button"
                onClick={() => handleSelectNetwork(network.networkId)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left cursor-pointer whitespace-nowrap",
                  "hover:bg-(--widget-row-hover) transition-colors",
                  network.networkId === networkData?.networkId &&
                    "bg-(--widget-row-bg)",
                )}
              >
                {network.iconUrl && (
                  <img
                    src={network.iconUrl}
                    alt={network.displayName}
                    className="w-4 h-4 rounded shrink-0"
                  />
                )}
                <span className="text-(--widget-fg)">
                  {network.displayName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-(--widget-error)">{error}</p>}
    </div>
  );
}
