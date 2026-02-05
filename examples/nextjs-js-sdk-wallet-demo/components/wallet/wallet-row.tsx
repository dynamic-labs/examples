"use client";

import { Send, Shield, Zap } from "lucide-react";
import { cn, truncateAddress } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { CopyButton } from "@/components/ui/copy-button";
import { useActiveNetwork } from "@/hooks/use-active-network";
import { use7702Authorization } from "@/hooks/use-7702-authorization";
import { useGasSponsorship } from "@/hooks/use-gas-sponsorship";
import { useMfaStatus } from "@/hooks/use-mfa-status";
import { useWalletAccounts } from "@/hooks/use-wallet-accounts";
import { isEvmWalletAccount, type WalletAccount } from "@/lib/dynamic-client";

interface WalletRowProps {
  walletAccount: WalletAccount;
  chain: string;
  onSend: () => void;
  onAuthorize?: () => void;
  onSetupMfa?: (address: string, chain: string) => void;
}

/**
 * Wallet row component displaying address and actions
 * Uses SDK data for all display info
 *
 * Action button scenarios:
 * 1. MFA setup needed (Shield) - if MFA required but no device
 * 2. Smart account needed (Zap) - if MFA enabled AND sponsored network AND not authorized
 *    (Without MFA, SDK handles authorization automatically during transaction)
 * 3. Send transaction (Send) - all other cases
 */
export function WalletRow({
  walletAccount,
  chain,
  onSend,
  onAuthorize,
  onSetupMfa,
}: WalletRowProps) {
  const { networkData } = useActiveNetwork(walletAccount);
  const { needsSetup: needsMfaSetup, requiresMfa } = useMfaStatus();
  const { walletAccounts } = useWalletAccounts();

  const isEvm = isEvmWalletAccount(walletAccount);

  // Check gas sponsorship availability on current network
  const {
    isSponsored,
    isLoading: sponsorLoading,
    zerodevWallet,
  } = useGasSponsorship(
    isEvm ? walletAccount.address : undefined,
    walletAccounts,
    networkData,
  );

  // Check 7702 authorization status for EVM wallets
  // Note: Check authorization independently of sponsorship to avoid race conditions
  const { isAuthorized, isLoading: authLoading } = use7702Authorization(
    isEvm ? walletAccount.address : undefined,
    networkData,
  );

  // Derived state for action button logic
  const isLoading = sponsorLoading || authLoading;
  // Only show authorize button when MFA is enabled - without MFA, SDK handles auth automatically
  // Note: zerodevWallet existence implies EVM (hook filters by isEvmWalletAccount)
  const canAuthorize =
    !!zerodevWallet && isSponsored && !isAuthorized && requiresMfa;

  // Determine which action button to show (priority order)
  const showMfaSetup = needsMfaSetup && onSetupMfa;
  const showAuthorize =
    !showMfaSetup && !isLoading && canAuthorize && onAuthorize;
  const showSend = !showMfaSetup && !showAuthorize;

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
        <CopyButton
          text={walletAccount.address}
          label="Copy address"
          showTooltip
          className="rounded-full"
        />

        {/* Primary action button - changes based on what's needed */}
        {showMfaSetup ? (
          <Tooltip content="Set up authenticator">
            <button
              type="button"
              onClick={() => onSetupMfa?.(walletAccount.address, chain)}
              className={cn(
                "p-2 rounded-full transition-colors cursor-pointer",
                "text-(--widget-accent) hover:bg-(--widget-accent)/10",
              )}
              aria-label="Set up authenticator"
            >
              <Shield className="w-4 h-4" />
            </button>
          </Tooltip>
        ) : showAuthorize ? (
          <Tooltip content="Enable smart account">
            <button
              type="button"
              onClick={onAuthorize}
              className={cn(
                "p-2 rounded-full transition-colors cursor-pointer",
                "text-(--widget-accent) hover:bg-(--widget-accent)/10",
              )}
              aria-label="Enable smart account"
            >
              <Zap className="w-4 h-4" />
            </button>
          </Tooltip>
        ) : showSend ? (
          <Tooltip content="Send transaction">
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
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}
