"use client";

/**
 * Solana Transaction Handler
 *
 * Handles sending SOL transfers and SPL token transfers on Solana networks.
 *
 * Transaction flow:
 * 1. Authenticate MFA if code provided
 * 2. Create transaction with recent blockhash
 * 3. Sign with embedded wallet via Dynamic SDK
 * 4. Broadcast to network
 *
 * For token transfers:
 * - Uses @solana/spl-token for SPL token instructions
 * - Automatically creates recipient's associated token account if needed
 *
 * Gas sponsorship:
 * - When `sponsored` is true, uses `signAndSendSponsoredTransaction` which
 *   sends the transaction to Dynamic's backend for fee sponsorship.
 * - If sponsorship fails, a `SponsorTransactionError` is thrown (no silent fallback).
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/solana/svm-gas-sponsorship
 */

import {
  type SolanaWalletAccount,
  signAndSendTransaction,
  signAndSendSponsoredTransaction,
  getMfaDevices,
  authenticateTotpMfaDevice,
} from "@/lib/dynamic";
import { createSolanaTransaction } from "./create-solana-transaction";
import { createSolanaTokenTransaction } from "./create-solana-token-transaction";

// =============================================================================
// TYPES
// =============================================================================

interface SendSolanaTransactionParams {
  walletAccount: SolanaWalletAccount;
  /** Amount in SOL or token units (e.g., "0.001") */
  amount: string;
  /** Recipient Solana address */
  recipient: string;
  /** Solana RPC endpoint URL */
  rpcUrl: string;
  /** TOTP code for MFA-protected transactions */
  mfaCode?: string;
  /** SPL token address (omit for native SOL transfer) */
  tokenAddress?: string;
  /** Token decimals (e.g., 6 for USDC, 9 for most SPL tokens) */
  tokenDecimals?: number;
  /** Use SVM gas sponsorship to cover transaction fees */
  sponsored?: boolean;
}

// =============================================================================
// SOLANA TRANSACTION
// =============================================================================

/**
 * Send a Solana transaction (native SOL or SPL token transfer)
 *
 * @param walletAccount - The Solana wallet to send from
 * @param amount - Amount as string (e.g., "0.001" SOL or "1.5" tokens)
 * @param recipient - Destination Solana address
 * @param rpcUrl - RPC endpoint for the Solana network
 * @param mfaCode - Optional TOTP code for MFA-protected transactions
 * @param tokenAddress - SPL token address (omit for native SOL)
 * @param tokenDecimals - Token decimals (required when tokenAddress is set)
 * @param sponsored - If true, use Dynamic's SVM gas sponsorship to cover fees
 * @returns Transaction signature
 * @throws Error if transaction fails
 * @throws SponsorTransactionError if sponsorship is requested but fails
 */
export async function sendSolanaTransaction({
  walletAccount,
  amount,
  recipient,
  rpcUrl,
  mfaCode,
  tokenAddress,
  tokenDecimals,
  sponsored = false,
}: SendSolanaTransactionParams): Promise<string> {
  // Authenticate MFA if code provided and user has device
  if (mfaCode) {
    const devices = await getMfaDevices();

    if (devices.length > 0) {
      await authenticateTotpMfaDevice({
        code: mfaCode,
        createMfaTokenOptions: { singleUse: true },
      });
    }
  }

  // Build the appropriate transaction
  const transaction = tokenAddress
    ? await createSolanaTokenTransaction({
        solanaWalletAccount: walletAccount,
        toAddress: recipient,
        amount,
        rpcUrl,
        tokenMintAddress: tokenAddress,
        tokenDecimals: tokenDecimals ?? 9,
      })
    : await createSolanaTransaction({
        solanaWalletAccount: walletAccount,
        toAddress: recipient,
        amount,
        rpcUrl,
      });

  // Sign and broadcast via Dynamic SDK
  // Type assertion handles potential @solana/web3.js version mismatches
  const txPayload = {
    transaction: transaction as unknown as Parameters<
      typeof signAndSendTransaction
    >[0]["transaction"],
    walletAccount,
  };

  // Use sponsored transaction when gas sponsorship is enabled
  // signAndSendSponsoredTransaction sends the tx to Dynamic's backend,
  // replaces the fee payer, and broadcasts with skipPreflight: true
  const { signature } = sponsored
    ? await signAndSendSponsoredTransaction(txPayload)
    : await signAndSendTransaction(txPayload);

  return signature;
}
