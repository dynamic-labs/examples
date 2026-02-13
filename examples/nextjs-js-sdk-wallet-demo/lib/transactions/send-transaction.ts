"use client";

import type { SignAuthorizationReturnType } from "viem/accounts";
import {
  type WalletAccount,
  type NetworkData,
  isEvmWalletAccount,
  isSolanaWalletAccount,
} from "@/lib/dynamic";
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
  /** TOTP code for MFA-protected transactions (all WaaS wallets) */
  mfaCode?: string;
  /** EIP-7702 authorization (for first tx after signing smart account, EVM only) */
  eip7702Auth?: SignAuthorizationReturnType;
  /** Token contract/mint address for token transfers (omit for native transfers) */
  tokenAddress?: string;
  /** Token decimals for token transfers (e.g., 6 for USDC, 18 for most ERC-20) */
  tokenDecimals?: number;
  /** Use SVM gas sponsorship to cover Solana transaction fees (Solana only) */
  sponsored?: boolean;
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
  mfaCode,
  eip7702Auth,
  tokenAddress,
  tokenDecimals,
  sponsored,
}: SendTransactionParams): Promise<string> {
  // EVM Chain
  if (isEvmWalletAccount(walletAccount)) {
    return sendEvmTransaction({
      walletAccount,
      amount,
      recipient,
      networkData,
      mfaCode,
      eip7702Auth,
      tokenAddress,
      tokenDecimals,
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
      mfaCode,
      tokenAddress,
      tokenDecimals,
      sponsored,
    });
  }

  throw new Error(
    `Unsupported chain: ${(walletAccount as WalletAccount).chain}`,
  );
}
