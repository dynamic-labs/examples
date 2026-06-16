"use client";

/**
 * DynamicWalletList
 *
 * Displays all embedded wallet accounts linked to the current user.
 * Shows EVM and Solana embedded wallets created by the WaaS SDK.
 */

import { useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { isSolanaWalletAccount } from "@dynamic-labs-sdk/solana";

export default function DynamicWalletList() {
  const accounts = useWalletAccounts();
  const evmAccount = accounts.find(isEvmWalletAccount);
  const solanaAccount = accounts.find(isSolanaWalletAccount);

  return (
    <div className="flex flex-col gap-3">
      {/* Header with wallet count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Embedded Wallets</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {accounts.length} {accounts.length === 1 ? "wallet" : "wallets"}
        </span>
      </div>

      {/* Wallet list or empty state */}
      {accounts.length === 0 ? (
        <div className="text-sm text-gray-500 py-4 text-center">
          No wallets found
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {evmAccount && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-300 bg-white">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">EVM Wallet</div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">
                  {evmAccount.address.slice(0, 6)}...{evmAccount.address.slice(-4)}
                </div>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                EVM
              </span>
            </div>
          )}
          {solanaAccount && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-300 bg-white">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">Solana Wallet</div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">
                  {solanaAccount.address.slice(0, 6)}...{solanaAccount.address.slice(-4)}
                </div>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                Solana
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
