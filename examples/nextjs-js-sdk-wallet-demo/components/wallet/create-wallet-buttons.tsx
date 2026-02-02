"use client";

import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorMessage } from "@/components/error-message";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCreateWallet } from "@/hooks/use-mutations";
import { useChainOptions } from "@/hooks/use-chain-options";
import type { Chain } from "@/lib/dynamic-client";

interface CreateWalletButtonsProps {
  className?: string;
}

/**
 * Create wallet dropdown - dynamically populated from SDK networks
 *
 * Uses useChainOptions() to derive available chain families (EVM, SOL, etc.)
 * from the networks enabled in your Dynamic dashboard.
 */
export function CreateWalletButtons({ className }: CreateWalletButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const chainOptions = useChainOptions();
  const {
    mutate: createWallet,
    isPending,
    error,
    variables,
  } = useCreateWallet();

  const handleCreateWallet = (chainId: Chain) => {
    createWallet(chainId);
    setIsOpen(false);
  };

  const creatingChainId = isPending ? variables : null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        {/* Backdrop to close dropdown when clicking outside */}
        {isOpen && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
        {/* Main button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 px-3 h-9",
            "bg-(--widget-row-bg) rounded-(--widget-radius)",
            "border border-(--widget-border)",
            "text-xs font-medium text-(--widget-muted)",
            "hover:bg-(--widget-row-hover) hover:text-(--widget-fg)",
            "transition-all cursor-pointer",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isPending ? (
            <>
              <LoadingSpinner size="sm" />
              Creating{" "}
              {chainOptions.find((c) => c.id === creatingChainId)?.name}{" "}
              wallet...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Wallet
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </>
          )}
        </button>

        {/* Dropdown menu - opens upward */}
        {isOpen && !isPending && chainOptions.length > 0 && (
          <div
            className={cn(
              "absolute bottom-full left-0 right-0 mb-2 z-10",
              "bg-(--widget-bg) border border-(--widget-border)",
              "rounded-(--widget-radius) shadow-lg overflow-hidden",
            )}
          >
            {chainOptions.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => handleCreateWallet(chain.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left",
                  "hover:bg-(--widget-row-hover) transition-colors cursor-pointer",
                )}
              >
                {chain.icon ? (
                  <img
                    src={chain.icon}
                    alt={chain.name}
                    className="w-7 h-7 rounded-lg"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-(--widget-row-bg) border border-(--widget-border) flex items-center justify-center">
                    <span className="text-[10px] font-medium text-(--widget-muted)">
                      {chain.id.slice(0, 3)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-(--widget-fg) tracking-[-0.14px] leading-5">
                    {chain.name}
                  </p>
                  <p className="text-xs text-(--widget-muted) tracking-[-0.12px] leading-4">
                    {chain.description}
                  </p>
                </div>
                <Plus className="w-3.5 h-3.5 text-(--widget-muted)" />
              </button>
            ))}
          </div>
        )}
      </div>

      <ErrorMessage error={error} />
    </div>
  );
}
