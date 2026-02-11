"use client";

import { useState, useRef, useEffect } from "react";
import { Coins, ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TokenBalanceInfo } from "@/lib/dynamic";

// =============================================================================
// TYPES
// =============================================================================

interface AssetSelectorProps {
  /** List of available assets (native + tokens) */
  assets: TokenBalanceInfo[];
  /** Currently selected asset */
  selected: TokenBalanceInfo | null;
  /** Called when user picks an asset */
  onSelect: (token: TokenBalanceInfo) => void;
  /** Whether the asset list is loading */
  loading?: boolean;
  /** Disable interactions */
  disabled?: boolean;
  /** Called when user wants to enter a token address manually */
  onManualEntry?: () => void;
}

// =============================================================================
// ASSET SELECTOR
// =============================================================================

/**
 * Compact inline asset selector pill with dropdown.
 *
 * Renders as a small pill button (`[icon] SOL [v]`) designed to sit
 * inside an input field via absolute positioning. The dropdown opens
 * upward to avoid clipping at the bottom of the widget.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <input className="pr-[7.5rem]" ... />
 *   <AssetSelector
 *     assets={tokenBalances}
 *     selected={selectedToken}
 *     onSelect={handleSelect}
 *     loading={tokensLoading}
 *   />
 * </div>
 * ```
 */
export function AssetSelector({
  assets,
  selected,
  onSelect,
  loading,
  disabled,
  onManualEntry,
}: AssetSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (token: TokenBalanceInfo) => {
    onSelect(token);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="absolute right-1 top-1 bottom-1">
      {/* Pill trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={cn(
          "h-full flex items-center gap-1.5 pl-2 pr-2 rounded-[calc(var(--widget-radius)-4px)]",
          "bg-(--widget-row-bg) border border-(--widget-border)",
          "hover:bg-(--widget-row-hover) transition-colors cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {selected?.logoURI ? (
          <img
            src={selected.logoURI}
            alt={selected.symbol}
            className="w-5 h-5 rounded-full"
          />
        ) : (
          <Coins className="w-4 h-4 text-(--widget-muted)" />
        )}
        <span className="text-xs font-medium text-(--widget-fg) max-w-[4rem] truncate">
          {selected?.symbol ?? (loading ? "..." : "Asset")}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-(--widget-muted) transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown — opens upward */}
      {open && (
        <div className="absolute z-10 bottom-full mb-1 right-0 w-56 max-h-48 overflow-y-auto bg-(--widget-bg) border border-(--widget-border) rounded-(--widget-radius) shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
          {loading ? (
            <div className="p-2.5 text-center text-xs text-(--widget-muted)">
              Loading assets...
            </div>
          ) : assets.length > 0 ? (
            <>
              {assets.map((token) => (
                <button
                  key={`${token.address}-${token.isNative}`}
                  type="button"
                  onClick={() => handleSelect(token)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2",
                    "hover:bg-(--widget-row-hover) transition-colors cursor-pointer",
                    "border-b border-(--widget-border) last:border-b-0",
                    selected?.address === token.address &&
                      selected?.isNative === token.isNative &&
                      "bg-(--widget-row-bg)",
                  )}
                >
                  {token.logoURI ? (
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-(--widget-border) flex items-center justify-center">
                      <Coins className="w-3 h-3 text-(--widget-muted)" />
                    </div>
                  )}
                  <span className="flex-1 min-w-0 text-left text-xs font-medium text-(--widget-fg) truncate">
                    {token.symbol}
                  </span>
                  <span className="text-[11px] text-(--widget-muted) tabular-nums">
                    {token.balance}
                  </span>
                </button>
              ))}
              {onManualEntry && (
                <button
                  type="button"
                  onClick={() => {
                    onManualEntry();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-(--widget-row-hover) transition-colors cursor-pointer text-(--widget-muted) hover:text-(--widget-fg)"
                >
                  <div className="w-5 h-5 rounded-full bg-(--widget-border) flex items-center justify-center">
                    <Pencil className="w-2.5 h-2.5" />
                  </div>
                  <span className="text-xs">Enter address manually</span>
                </button>
              )}
            </>
          ) : (
            <div className="p-2.5 text-center text-xs text-(--widget-muted)">
              No assets found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
