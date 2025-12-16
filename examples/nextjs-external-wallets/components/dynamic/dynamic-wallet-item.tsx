"use client";

/**
 * DynamicWalletItem
 *
 * Displays a single wallet in the connected wallets list with:
 * - Wallet icon and name (from wallet book)
 * - Truncated address
 * - Current network badge (auto-updates on network changes)
 * - Click to switch: makes this wallet the primary wallet
 * - Delete button: removes the wallet from the account
 */

import { isEthereumWallet } from "@dynamic-labs/ethereum";
import {
  useDynamicContext,
  useSwitchWallet,
  type useUserWallets,
} from "@dynamic-labs/sdk-react-core";
import { useWalletBookCdn, WalletIcon } from "@dynamic-labs/wallet-book";
import { Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { fetchWalletNetwork, type NetworkInfo } from "@/lib/get-wallet-network";
import { truncateAddress } from "@/lib/truncate-address";
import { cn } from "@/lib/utils";

// Type for a wallet from the useUserWallets hook
type Wallet = ReturnType<typeof useUserWallets>[number];

interface DynamicWalletItemProps {
  wallet: Wallet;
}

export default function DynamicWalletItem({ wallet }: DynamicWalletItemProps) {
  // Dynamic SDK hooks for wallet management
  const { primaryWallet, removeWallet } = useDynamicContext();
  const switchWallet = useSwitchWallet();

  // Get wallet metadata from the wallet book
  const { wallets: walletBookWallets } = useWalletBookCdn();

  // Local state
  const [network, setNetwork] = useState<NetworkInfo>({ name: "Unknown" });
  const [isRemoving, setIsRemoving] = useState(false);

  // Normalize wallet key for wallet book lookup
  const walletKey = wallet.key.endsWith("sol")
    ? wallet.key.slice(0, -3)
    : wallet.key;

  const walletName = walletBookWallets[walletKey]?.name || walletKey;
  const isPrimary = primaryWallet?.id === wallet.id;

  /**
   * Fetches and updates the network info for this wallet.
   * Called on mount and when network changes are detected.
   */
  const loadNetwork = useCallback(async () => {
    try {
      const result = await fetchWalletNetwork(wallet);
      setNetwork(result.network);
    } catch (error) {
      console.debug("Error fetching network info:", error);
      setNetwork({ name: "Unknown" });
    }
  }, [wallet]);

  // Load network info and set up network change listener
  useEffect(() => {
    loadNetwork();

    // For Ethereum wallets, listen to network changes from the connector
    if (isEthereumWallet(wallet)) {
      const connector = wallet.connector;

      const handleNetworkChange = () => {
        loadNetwork();
      };

      // Subscribe to chain change events (if connector supports it)
      connector.on?.("chainChange", handleNetworkChange);

      return () => {
        connector.off?.("chainChange", handleNetworkChange);
      };
    }
  }, [wallet, loadNetwork]);

  /**
   * Switches to this wallet as the primary wallet.
   * Only available when this is not already the primary wallet.
   */
  const handleClick = () => {
    if (!isPrimary) switchWallet(wallet.id);
  };

  /**
   * Removes this wallet from the user's account.
   * Uses optimistic UI with loading state.
   */
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering wallet switch
    if (isRemoving) return;

    setIsRemoving(true);
    try {
      await removeWallet(wallet.id);
    } catch (error) {
      console.error("Error removing wallet:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors w-full",
        "bg-white hover:border-gray-500",
        isPrimary ? "border-gray-400" : "border-gray-300"
      )}
    >
      {/* Clickable area to switch wallet */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPrimary}
        className="flex items-center gap-3 flex-1 text-left cursor-pointer disabled:cursor-default"
      >
        {/* Wallet Icon */}
        <div className="shrink-0">
          <WalletIcon walletKey={walletKey} className="w-6 h-6" />
        </div>

        {/* Wallet Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm">{walletName}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {truncateAddress(wallet.address)}
          </div>
        </div>

        {/* Network Badge */}
        <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-full bg-gray-100">
          {network.iconUrl && (
            <div
              className="w-4 h-4 rounded bg-cover bg-center"
              style={{ backgroundImage: `url(${network.iconUrl})` }}
              role="img"
              aria-label={network.name}
            />
          )}
          <span className="text-xs text-gray-600 font-medium">
            {network.name}
          </span>
        </div>
      </button>

      {/* Delete Button */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isRemoving}
        className="shrink-0 p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Remove wallet"
        title="Remove wallet"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
