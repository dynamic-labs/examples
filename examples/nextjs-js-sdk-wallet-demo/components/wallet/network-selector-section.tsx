"use client";

import { Zap } from "lucide-react";
import { NetworkSelector } from "@/components/wallet/network-selector";
import { useActiveNetwork } from "@/hooks/use-active-network";
import { useNetworks } from "@/hooks/use-networks";
import type {
  EvmWalletAccount,
  SolanaWalletAccount,
} from "@/lib/dynamic";

type SponsorshipStatus =
  | { type: "loading" }
  | { type: "sponsored" }
  | { type: "available"; message?: string }
  | { type: "unavailable"; message?: string }
  | { type: "standard" };

interface NetworkSelectorSectionProps {
  /** Wallet account for network selector */
  walletAccount: EvmWalletAccount | SolanaWalletAccount;
  /** Called when network changes */
  onNetworkChange: () => void;
  /** Sponsorship status */
  sponsorship?: SponsorshipStatus;
}

/**
 * Network selector with sponsorship status badge
 *
 * Reusable component for send-tx and authorize-7702 screens
 */
export function NetworkSelectorSection({
  walletAccount,
  onNetworkChange,
  sponsorship,
}: NetworkSelectorSectionProps) {
  const { networkData } = useActiveNetwork(walletAccount);
  const { networks } = useNetworks();

  // Check if there are multiple networks for this chain
  const availableNetworks = networks.filter(
    (n) => n.chain === walletAccount.chain,
  );
  const hasMultipleNetworks = availableNetworks.length > 1;

  const renderSponsorshipBadge = () => {
    if (!sponsorship) return null;

    switch (sponsorship.type) {
      case "loading":
        return (
          <span className="text-[10px] text-(--widget-muted)">
            Checking gas...
          </span>
        );
      case "sponsored":
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium text-(--widget-accent)">
            <Zap className="w-3 h-3" />
            Gas Sponsored
          </span>
        );
      case "available":
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium text-(--widget-accent)">
            <Zap className="w-3 h-3" />
            {sponsorship.message ?? "Sponsorship available"}
          </span>
        );
      case "unavailable":
        return (
          <span className="text-[10px] text-(--widget-muted)">
            {sponsorship.message ?? "No sponsorship"}
          </span>
        );
      case "standard":
        return (
          <span className="text-[10px] text-(--widget-muted)">
            Standard transaction
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-3 bg-(--widget-row-bg) border border-(--widget-border) rounded-(--widget-radius)">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-(--widget-fg) tracking-[-0.14px]">
            Network
          </span>
          {renderSponsorshipBadge()}
        </div>

        {/* Network display: show selector if multiple networks, otherwise just network info */}
        {hasMultipleNetworks ? (
          <NetworkSelector
            walletAccount={walletAccount}
            onNetworkChange={onNetworkChange}
          />
        ) : (
          networkData && (
            <div className="flex items-center gap-2">
              {networkData.iconUrl && (
                <img
                  src={networkData.iconUrl}
                  alt={networkData.displayName}
                  className="w-5 h-5 rounded"
                />
              )}
              <span className="text-sm font-medium text-(--widget-fg)">
                {networkData.displayName}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
