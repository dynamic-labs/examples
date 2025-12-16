"use client";

/**
 * DynamicWalletList
 *
 * Displays all wallets linked to the current user's account.
 * Each wallet can be clicked to make it the primary wallet,
 * or deleted to remove it from the account.
 */

import { useUserWallets } from "@dynamic-labs/sdk-react-core";
import DynamicWalletItem from "./dynamic-wallet-item";

export default function DynamicWalletList() {
  // Get all wallets linked to the current user
  const wallets = useUserWallets();

  return (
    <div className="flex flex-col gap-3">
      {/* Header with wallet count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Connected Wallets
        </h2>
        {wallets.length > 0 && (
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {wallets.length} {wallets.length === 1 ? "wallet" : "wallets"}
          </span>
        )}
      </div>

      {/* Wallet list or empty state */}
      {wallets.length === 0 ? (
        <div className="text-sm text-gray-500 py-4 text-center">
          No wallets connected
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {wallets.map((wallet) => (
            <DynamicWalletItem key={wallet.id} wallet={wallet} />
          ))}
        </div>
      )}
    </div>
  );
}
