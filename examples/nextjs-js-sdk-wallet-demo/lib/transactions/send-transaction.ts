"use client";

import {
  type WalletAccount,
  type NetworkData,
  isEvmWalletAccount,
  isSolanaWalletAccount,
} from "@/lib/dynamic-client";
import { sendEvmTransaction } from "./send-evm-transaction";
import { sendSolanaTransaction } from "./send-solana-transaction";

// =============================================================================
// TYPES
// =============================================================================

export interface SendTransactionParams {
  walletAccount: WalletAccount;
  amount: string;
  recipient: string;
  networkData: NetworkData;
}

// =============================================================================
// UNIFIED TRANSACTION FUNCTION
// =============================================================================

/**
 * Send transaction - dispatches to chain-specific handlers
 *
 * Wallet selection (ZeroDev vs base) is handled by useGasSponsorship hook
 * before this function is called.
 */
export async function sendTransaction({
  walletAccount,
  amount,
  recipient,
  networkData,
}: SendTransactionParams): Promise<string> {
  // EVM Chain
  if (isEvmWalletAccount(walletAccount)) {
    return sendEvmTransaction({
      walletAccount,
      amount,
      recipient,
      networkData,
    });
  }

  // Solana Chain
  if (isSolanaWalletAccount(walletAccount)) {
    const rpcUrl = networkData.rpcUrls?.http?.[0];
    if (!rpcUrl) throw new Error("No RPC URL available for Solana network");

    return sendSolanaTransaction({
      walletAccount,
      amount,
      recipient,
      rpcUrl,
    });
  }

  throw new Error(
    `Unsupported chain: ${(walletAccount as WalletAccount).chain}`,
  );
}
