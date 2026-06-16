"use client";

/**
 * DynamicWalletItem
 *
 * Displays a single embedded wallet account.
 * Note: This component is now superseded by the inline rendering in
 * DynamicWalletList. It is kept here for reference but is not imported.
 */

import { cn } from "@/lib/utils";

interface WalletAccount {
  address: string;
  chain?: string;
}

interface DynamicWalletItemProps {
  account: WalletAccount;
  isPrimary?: boolean;
}

export default function DynamicWalletItem({
  account,
  isPrimary = false,
}: DynamicWalletItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors w-full bg-white",
        isPrimary ? "border-gray-400" : "border-gray-300"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm">
          {account.chain ?? "Wallet"}
        </div>
        <div className="text-xs text-gray-500 font-mono mt-0.5">
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </div>
      </div>
    </div>
  );
}
