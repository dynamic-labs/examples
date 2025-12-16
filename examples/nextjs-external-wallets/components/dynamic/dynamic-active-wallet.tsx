"use client";

/**
 * DynamicActiveWallet
 *
 * Displays the currently active (primary) wallet with:
 * - Wallet icon and name
 * - Truncated address
 * - Network selector (for Ethereum wallets that support network switching)
 * - Static network badge (for Solana or wallets that don't support switching)
 */

import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useWalletBookCdn, WalletIcon } from "@dynamic-labs/wallet-book";
import { useEffect, useState } from "react";
import { fetchWalletNetwork, type NetworkInfo } from "@/lib/get-wallet-network";
import { truncateAddress } from "@/lib/truncate-address";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function DynamicActiveWallet() {
  // Get the primary (currently active) wallet from Dynamic context
  const { primaryWallet } = useDynamicContext();

  // Get wallet metadata (icons, names) from the wallet book
  const { wallets: walletBookWallets } = useWalletBookCdn();

  // Network state for display
  const [network, setNetwork] = useState<NetworkInfo>({ name: "Unknown" });
  const [currentNetworkId, setCurrentNetworkId] = useState<
    string | number | null
  >(null);

  /**
   * Handles network switching when user selects a different network.
   * Only applicable for Ethereum wallets that support network switching.
   */
  const handleNetworkChange = async (value: string) => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;

    const chainId = parseInt(value, 10);

    if (primaryWallet.connector.supportsNetworkSwitching()) {
      try {
        // Request the wallet to switch networks
        await primaryWallet.switchNetwork(chainId);
        setCurrentNetworkId(chainId);

        // Update the displayed network info immediately
        const enabledNetworks = primaryWallet.connector.getEnabledNetworks();
        const networkInfo = enabledNetworks?.find(
          (n) => String(n.chainId || n.networkId) === String(chainId)
        );

        if (networkInfo) {
          setNetwork({
            name: networkInfo.vanityName || networkInfo.name || "Unknown",
            iconUrl: networkInfo.iconUrls?.[0],
          });
        }
      } catch (error) {
        console.error("Error switching network", error);
      }
    }
  };

  // Fetch network info when the primary wallet changes
  useEffect(() => {
    const loadNetwork = async () => {
      try {
        const result = await fetchWalletNetwork(primaryWallet);
        setNetwork(result.network);
        setCurrentNetworkId(result.networkId);
      } catch (error) {
        console.debug("Error fetching network info:", error);
        setNetwork({ name: "Unknown" });
        setCurrentNetworkId(null);
      }
    };
    loadNetwork();
  }, [primaryWallet]);

  // Don't render if no wallet is connected
  if (!primaryWallet) return null;

  // Normalize wallet key for wallet book lookup
  // (Solana wallets have "sol" suffix that needs to be removed)
  const walletKey = primaryWallet.key.endsWith("sol")
    ? primaryWallet.key.slice(0, -3)
    : primaryWallet.key;

  const walletName = walletBookWallets[walletKey]?.name || walletKey;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-300 bg-white">
      {/* Wallet Icon */}
      <div className="shrink-0">
        <WalletIcon walletKey={walletKey} className="w-6 h-6" />
      </div>

      {/* Wallet Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm">{walletName}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {truncateAddress(primaryWallet.address)}
        </div>
      </div>

      {/* Network Selector (Ethereum) or Static Badge (Solana/other) */}
      {isEthereumWallet(primaryWallet) &&
      primaryWallet.connector.supportsNetworkSwitching() ? (
        // Interactive network selector for Ethereum wallets
        <Select
          value={currentNetworkId ? String(currentNetworkId) : undefined}
          onValueChange={handleNetworkChange}
        >
          <SelectTrigger className="h-auto py-1 px-2 shrink-0 gap-1.5 text-xs">
            {network.iconUrl && (
              <div
                className="w-4 h-4 rounded bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${network.iconUrl})` }}
                role="img"
                aria-label={network.name}
              />
            )}
            <SelectValue placeholder={network.name} />
          </SelectTrigger>
          <SelectContent>
            {primaryWallet.connector.getEnabledNetworks()?.map((net) => (
              <SelectItem
                key={net.chainId || net.networkId}
                value={String(net.chainId || net.networkId)}
              >
                {net.vanityName || net.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        // Static network badge for Solana or wallets without network switching
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
      )}
    </div>
  );
}
