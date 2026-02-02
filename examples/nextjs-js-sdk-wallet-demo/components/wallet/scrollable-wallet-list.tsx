"use client";

import { useState, useCallback } from "react";
import { Wallet } from "lucide-react";
import { WalletRow } from "./wallet-row";
import { cn } from "@/lib/utils";
import type { WalletAccount } from "@/lib/dynamic-client";

interface UniqueWallet {
  address: string;
  chain: string;
  walletAccount: WalletAccount;
  hasZeroDev: boolean;
}

interface ScrollableWalletListProps {
  wallets: UniqueWallet[];
  onSend: (address: string, chain: string) => void;
}

/**
 * Scrollable wallet list with fade indicators
 */
export function ScrollableWalletList({
  wallets,
  onSend,
}: ScrollableWalletListProps) {
  const [scrollState, setScrollState] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });

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
        {wallets.map((wallet) => (
          <WalletRow
            key={wallet.address}
            walletAccount={wallet.walletAccount}
            onSend={() => onSend(wallet.address, wallet.chain)}
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
  );
}
