"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  History,
  ExternalLink,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ChevronDown,
  Send,
  Wallet,
} from "lucide-react";
import { cn, truncateAddress } from "@/lib/utils";
import { WidgetCard } from "@/components/ui/widget-card";
import { ScrollableWithFade } from "@/components/ui/scrollable-with-fade";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CopyButton } from "@/components/ui/copy-button";
import { Tooltip } from "@/components/ui/tooltip";
import { NetworkSelector } from "@/components/wallet/network-selector";
import { useWalletAccounts } from "@/hooks/use-wallet-accounts";
import { useActiveNetwork } from "@/hooks/use-active-network";
import { useNetworks } from "@/hooks/use-networks";
import { getTransactionHistory, type Chain } from "@/lib/dynamic";
import type { NavigationReturn } from "@/hooks/use-navigation";

interface TxHistoryScreenProps {
  walletAddress: string;
  chain: string;
  networkId: number;
  navigation: NavigationReturn;
}

const PAGE_SIZE = 10;

/**
 * Transaction history screen for SVM wallets
 *
 * Fetches and displays transaction history using the Dynamic SDK's
 * getTransactionHistory function. Supports pagination via "Load More".
 * Includes an inline network selector to switch between networks.
 */
export function TxHistoryScreen({
  walletAddress,
  chain,
  networkId: initialNetworkId,
  navigation,
}: TxHistoryScreenProps) {
  const [offset, setOffset] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  // Find the wallet account for this address
  const { walletAccounts } = useWalletAccounts();
  const walletAccount =
    walletAccounts.find(
      (w) => w.address.toLowerCase() === walletAddress.toLowerCase(),
    ) || null;

  // Get active network (updates reactively when user switches)
  const { networkData, refetch: refetchNetwork } =
    useActiveNetwork(walletAccount);

  // Check if multiple networks are available
  const { networks } = useNetworks();
  const availableNetworks = networks.filter(
    (n) => n.chain === walletAccount?.chain,
  );
  const hasMultipleNetworks = availableNetworks.length > 1;

  // Use the active network's ID, falling back to the initial one
  // Coerce to number since NetworkData.networkId can be string | number
  const activeNetworkId = Number(networkData?.networkId ?? initialNetworkId);

  // Fetch transaction history
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["txHistory", walletAddress, chain, activeNetworkId, offset],
    queryFn: () =>
      getTransactionHistory({
        address: walletAddress,
        chain: chain as Chain,
        networkId: activeNetworkId,
        limit: PAGE_SIZE,
        offset,
      }),
  });

  const transactions = data?.transactions ?? [];
  const nextOffset = data?.nextOffset || undefined;

  const handleNetworkChange = () => {
    // Reset pagination when network changes
    setOffset(undefined);
    refetchNetwork();
  };

  const handleLoadMore = () => {
    if (nextOffset) setOffset(nextOffset);
  };

  const handleRefresh = () => {
    setOffset(undefined);
    queryClient.invalidateQueries({
      queryKey: ["txHistory", walletAddress, chain, activeNetworkId],
    });
    refetch();
  };

  return (
    <WidgetCard
      icon={
        networkData?.iconUrl ? (
          <img
            src={networkData.iconUrl}
            alt={networkData.displayName}
            className="w-[18px] h-[18px] rounded object-contain"
          />
        ) : (
          <Wallet
            className="w-[18px] h-[18px] text-(--widget-fg)"
            strokeWidth={1.5}
          />
        )
      }
      title="Transactions"
      subtitle={truncateAddress(walletAddress)}
      onClose={navigation.goToDashboard}
      className="overflow-visible"
    >
      <div className="space-y-2">
        {/* Toolbar: network selector + action icons */}
        <div className="flex items-center justify-between gap-2 overflow-visible relative z-10">
          {/* Left: Network selector or static badge */}
          {walletAccount && hasMultipleNetworks ? (
            <NetworkSelector
              walletAccount={walletAccount}
              onNetworkChange={handleNetworkChange}
              align="left"
            />
          ) : (
            <div className="flex items-center gap-2">
              {networkData?.iconUrl && (
                <img
                  src={networkData.iconUrl}
                  alt={networkData.displayName}
                  className="w-4 h-4 rounded"
                />
              )}
              <span className="text-xs font-medium text-(--widget-fg)">
                {networkData?.displayName ?? chain}
              </span>
            </div>
          )}

          {/* Right: icon actions */}
          <div className="flex items-center gap-0.5">
            <CopyButton
              text={walletAddress}
              label="Copy address"
              showTooltip
              className="rounded-full"
            />

            <Tooltip content="Send transaction">
              <button
                type="button"
                onClick={() =>
                  navigation.goToSendTx(walletAddress, chain, undefined, {
                    networkId: activeNetworkId,
                  })
                }
                className="p-2 rounded-full transition-colors cursor-pointer text-(--widget-muted) hover:text-(--widget-fg) hover:bg-black/5"
                aria-label="Send transaction"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip content="Refresh">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isFetching}
                className="p-2 rounded-full transition-colors cursor-pointer text-(--widget-muted) hover:text-(--widget-fg) hover:bg-black/5 disabled:opacity-50"
                aria-label="Refresh transactions"
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5", isFetching && "animate-spin")}
                />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center py-5 gap-2">
            <p className="text-sm text-(--widget-error)">
              Failed to load transactions
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && transactions.length === 0 && (
          <div className="flex flex-col items-center py-6 gap-1.5">
            <div className="w-10 h-10 rounded-full bg-(--widget-row-bg) flex items-center justify-center mb-1">
              <History
                className="w-5 h-5 text-(--widget-muted)"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-sm font-medium text-(--widget-fg)">
              No transactions yet
            </p>
            <p className="text-xs text-(--widget-muted) text-center max-w-[220px]">
              Transactions will appear here once this wallet has activity.
            </p>
          </div>
        )}

        {/* Transaction list */}
        {!isLoading && transactions.length > 0 && (
          <ScrollableWithFade contentClassName="space-y-1.5">
            {transactions.map((tx) => (
              <TransactionRow key={tx.transactionHash} tx={tx} chain={chain} />
            ))}
          </ScrollableWithFade>
        )}

        {nextOffset && !isLoading && transactions.length >= PAGE_SIZE && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleLoadMore}
            loading={isFetching && !isLoading}
          >
            <ChevronDown className="w-4 h-4" />
            Load More
          </Button>
        )}
      </div>
    </WidgetCard>
  );
}

// =============================================================================
// TRANSACTION ROW
// =============================================================================

interface TransactionRowProps {
  tx: {
    transactionHash: string;
    labels?: unknown[];
    transactionTimestamp: Date;
    blockExplorerUrls?: string[];
    assetTransfers?: {
      metadata?: { symbol?: string; decimals?: number };
      amount?: number;
    }[];
    fromAddress: string;
    toAddress: string;
  };
  chain: string;
}

/**
 * Single transaction row — extracted for readability
 */
function TransactionRow({ tx, chain }: TransactionRowProps) {
  const isSent = (tx.labels as string[])?.includes("sent");
  const isReceived = (tx.labels as string[])?.includes("receive");
  const timestamp = new Date(tx.transactionTimestamp);
  const explorerUrl = tx.blockExplorerUrls?.[0];

  const primaryTransfer = tx.assetTransfers?.[0];
  const symbol = primaryTransfer?.metadata?.symbol ?? chain;
  const decimals = primaryTransfer?.metadata?.decimals ?? 0;
  const rawAmount = primaryTransfer?.amount;
  // Convert raw amount using token decimals (e.g. 900000 with 9 decimals = 0.0009)
  const amount =
    rawAmount != null ? rawAmount / Math.pow(10, decimals) : undefined;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-2",
        "bg-(--widget-row-bg) rounded-(--widget-radius)",
        "transition-colors hover:bg-(--widget-row-hover)",
        explorerUrl ? "cursor-pointer" : "cursor-default",
      )}
    >
      {/* Direction icon */}
      <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center bg-(--widget-bg) border border-(--widget-border)">
        {isSent ? (
          <ArrowUpRight className="w-3.5 h-3.5 text-(--widget-error)" />
        ) : isReceived ? (
          <ArrowDownLeft className="w-3.5 h-3.5 text-(--widget-success)" />
        ) : (
          <History className="w-3.5 h-3.5 text-(--widget-muted)" />
        )}
      </div>

      {/* Transaction details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-(--widget-fg) tracking-[-0.12px]">
            {isSent ? "Sent" : isReceived ? "Received" : "Transaction"}
          </p>
          {amount != null && (
            <p
              className={cn(
                "text-xs font-medium tracking-[-0.12px] tabular-nums",
                isSent
                  ? "text-(--widget-error)"
                  : isReceived
                    ? "text-(--widget-success)"
                    : "text-(--widget-fg)",
              )}
            >
              {isSent ? "-" : isReceived ? "+" : ""}
              {Number(amount).toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}{" "}
              {symbol}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-(--widget-muted) tracking-[-0.12px] truncate">
            {isSent
              ? `To ${truncateAddress(tx.toAddress)}`
              : isReceived
                ? `From ${truncateAddress(tx.fromAddress)}`
                : truncateAddress(tx.transactionHash)}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-(--widget-muted) tabular-nums">
              {formatRelativeTime(timestamp)}
            </span>
            {explorerUrl && (
              <ExternalLink className="w-3 h-3 text-(--widget-muted)" />
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format a date as relative time (e.g., "2m ago", "3h ago", "5d ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
