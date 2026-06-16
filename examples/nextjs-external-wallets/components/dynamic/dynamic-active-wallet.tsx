"use client";

/**
 * DynamicActiveWallet
 *
 * Displays the currently active embedded wallet with:
 * - Wallet type label (EVM or Solana)
 * - Truncated address
 * - Chain badge
 *
 * The new headless JS SDK uses embedded (MPC/WaaS) wallets — connector-based
 * network switching is not available, so this component shows a static badge.
 */

import { useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { isSolanaWalletAccount } from "@dynamic-labs-sdk/solana";

export default function DynamicActiveWallet() {
  const accounts = useWalletAccounts();
  const evmAccount = accounts.find(isEvmWalletAccount);
  const solanaAccount = accounts.find(isSolanaWalletAccount);

  const primaryAccount = evmAccount ?? solanaAccount;
  if (!primaryAccount) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-300 bg-white">
      {/* Wallet Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm">
          {evmAccount ? "EVM Wallet" : "Solana Wallet"}
        </div>
        <div className="text-xs text-gray-500 font-mono mt-0.5">
          {primaryAccount.address.slice(0, 6)}...{primaryAccount.address.slice(-4)}
        </div>
      </div>

      {/* Static chain badge */}
      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
        {evmAccount ? "EVM" : "Solana"}
      </span>
    </div>
  );
}
