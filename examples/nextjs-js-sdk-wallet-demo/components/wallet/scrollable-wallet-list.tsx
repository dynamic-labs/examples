"use client";

import { useState, useCallback, useMemo } from "react";
import { Wallet } from "lucide-react";
import { WalletRow } from "./wallet-row";
import { cn } from "@/lib/utils";
import type { WalletAccount } from "@/lib/dynamic";

interface UniqueWallet {
  address: string;
  chain: string;
  walletAccount: WalletAccount;
  hasZeroDev: boolean;
}

interface ScrollableWalletListProps {
  wallets: UniqueWallet[];
  onSend: (address: string, chain: string) => void;
  onAuthorize?: (address: string) => void;
  onSetupMfa?: (address: string, chain: string) => void;
  onRowClick?: (address: string, chain: string, networkId: number) => void;
}

type ChainFilter = "all" | string;

/**
 * Scrollable wallet list with chain filter tabs
 */
export function ScrollableWalletList({
  wallets,
  onSend,
  onAuthorize,
  onSetupMfa,
  onRowClick,
}: ScrollableWalletListProps) {
  const [filter, setFilter] = useState<ChainFilter>("all");
  const [scrollState, setScrollState] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });

  // Build available chains from actual wallet data
  const availableChains = useMemo(() => {
    const counts = new Map<string, number>();
    for (const wallet of wallets) {
      counts.set(wallet.chain, (counts.get(wallet.chain) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([chain, count]) => ({
      chain,
      count,
    }));
  }, [wallets]);

  // Filter wallets based on selected tab
  const filteredWallets = useMemo(() => {
    if (filter === "all") return wallets;
    return wallets.filter((w) => w.chain === filter);
  }, [wallets, filter]);

  // Only show tabs if we have wallets on multiple chains
  const showTabs = availableChains.length > 1;

  // Ref callback - check initial scroll state on mount
  const scrollRefCallback = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      const canScrollDown = el.scrollHeight > el.clientHeight;
      setScrollState({ canScrollUp: false, canScrollDown });
    }
  }, []);

  // Update scroll state on scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const canScrollUp = el.scrollTop > 0;
    const canScrollDown = el.scrollTop < el.scrollHeight - el.clientHeight - 1;
    setScrollState({ canScrollUp, canScrollDown });
  }, []);

  if (wallets.length === 0) {
    return (
      <div className="text-center py-8">
        <Wallet
          className="w-12 h-12 mx-auto text-(--widget-muted) mb-3"
          strokeWidth={1.5}
        />
        <p className="text-sm text-(--widget-muted)">
          No wallets yet. Create one below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Chain filter tabs - only shown when wallets exist on multiple chains */}
      {showTabs && (
        <div className="flex gap-1 p-1 bg-(--widget-row-bg) rounded-(--widget-radius)">
          <FilterTab
            active={filter === "all"}
            onClick={() => setFilter("all")}
            count={wallets.length}
          >
            All
          </FilterTab>
          {availableChains.map(({ chain, count }) => (
            <FilterTab
              key={chain}
              active={filter === chain}
              onClick={() => setFilter(chain)}
              count={count}
            >
              {chain}
            </FilterTab>
          ))}
        </div>
      )}

      {/* Wallet list */}
      <div className="relative">
        {/* Top scroll indicator */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-6 pointer-events-none z-10",
            "bg-linear-to-b from-(--widget-bg) to-transparent",
            "transition-opacity duration-200",
            scrollState.canScrollUp ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Scrollable list */}
        <div
          ref={scrollRefCallback}
          onScroll={handleScroll}
          className="max-h-80 overflow-y-auto -mx-1 px-1 space-y-2 scrollbar-thin"
        >
          {filteredWallets.map((wallet) => (
            <WalletRow
              key={wallet.address}
              walletAccount={wallet.walletAccount}
              chain={wallet.chain}
              onSend={() => onSend(wallet.address, wallet.chain)}
              onAuthorize={
                onAuthorize ? () => onAuthorize(wallet.address) : undefined
              }
              onSetupMfa={onSetupMfa}
              onRowClick={onRowClick}
            />
          ))}
        </div>

        {/* Bottom scroll indicator */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10",
            "bg-linear-to-t from-(--widget-bg) to-transparent",
            "transition-opacity duration-200",
            scrollState.canScrollDown ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  );
}

/**
 * Filter tab button
 */
function FilterTab({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 px-3 py-1.5 text-xs font-medium rounded-[calc(var(--widget-radius)-4px)] transition-colors cursor-pointer",
        active
          ? "bg-(--widget-bg) text-(--widget-fg) shadow-sm"
          : "text-(--widget-muted) hover:text-(--widget-fg)",
      )}
    >
      {children}
      <span
        className={cn(
          "ml-1.5 text-[10px]",
          active ? "text-(--widget-muted)" : "text-(--widget-muted)/60",
        )}
      >
        {count}
      </span>
    </button>
  );
}
