"use client";

import { useState } from "react";
import { Copy, Check, Send } from "lucide-react";
import { cn, truncateAddress, copyToClipboard } from "@/lib/utils";
import { useActiveNetwork } from "@/hooks/use-active-network";
import type { WalletAccount } from "@/lib/dynamic-client";

interface WalletRowProps {
  walletAccount: WalletAccount;
  onSend: () => void;
}

/**
 * Wallet row component displaying address and actions
 * Uses SDK data for all display info
 */
export function WalletRow({ walletAccount, onSend }: WalletRowProps) {
  const [copied, setCopied] = useState(false);
  const { networkData } = useActiveNetwork(walletAccount);

  const handleCopy = async () => {
    const success = await copyToClipboard(walletAccount.address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        "px-3 py-2.5",
        "bg-(--widget-row-bg) rounded-(--widget-radius)",
        "transition-colors hover:bg-(--widget-row-hover)",
      )}
    >
      {/* Left: Chain icon + Address */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Network icon from SDK */}
        <div className="w-8 h-8 shrink-0 rounded-lg overflow-hidden bg-(--widget-bg) border border-(--widget-border) flex items-center justify-center">
          {networkData?.iconUrl ? (
            <img
              src={networkData.iconUrl}
              alt={networkData.displayName}
              className="w-5 h-5 object-contain"
            />
          ) : (
            <span className="text-[10px] font-medium text-(--widget-muted)">
              {walletAccount.chain}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-(--widget-fg) tracking-[-0.14px] leading-5 truncate">
            {truncateAddress(walletAccount.address)}
          </p>
          <p className="text-xs text-(--widget-muted) tracking-[-0.12px] leading-4">
            {walletAccount.chain}
            {networkData?.displayName && ` · ${networkData.displayName}`}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "p-2 rounded-full transition-colors cursor-pointer",
            "text-(--widget-muted) hover:text-(--widget-fg) hover:bg-black/5",
          )}
          aria-label="Copy address"
        >
          {copied ? (
            <Check className="w-4 h-4 text-(--widget-success)" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {/* Send button */}
        <button
          type="button"
          onClick={onSend}
          className={cn(
            "p-2 rounded-full transition-colors cursor-pointer",
            "text-(--widget-muted) hover:text-(--widget-fg) hover:bg-black/5",
          )}
          aria-label="Send transaction"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
