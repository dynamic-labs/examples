"use client";

/**
 * Solana Transaction Handler
 *
 * Handles sending SOL transfers on Solana networks.
 *
 * Transaction flow:
 * 1. Create transaction with recent blockhash
 * 2. Sign with embedded wallet via Dynamic SDK
 * 3. Broadcast to network
 *
 * Note: Gas sponsorship is not available for Solana (unlike EVM with ZeroDev)
 */

import {
  type SolanaWalletAccount,
  signAndSendTransaction,
} from "@/lib/dynamic-client";
import { createSolanaTransaction } from "./create-solana-transaction";

// =============================================================================
// TYPES
// =============================================================================

interface SendSolanaTransactionParams {
  walletAccount: SolanaWalletAccount;
  /** Amount in SOL (e.g., "0.001") */
  amount: string;
  /** Recipient Solana address */
  recipient: string;
  /** Solana RPC endpoint URL */
  rpcUrl: string;
}

// =============================================================================
// SOLANA TRANSACTION
// =============================================================================

/**
 * Send a Solana SOL transfer transaction
 *
 * @param walletAccount - The Solana wallet to send from
 * @param amount - Amount in SOL as string (e.g., "0.001")
 * @param recipient - Destination Solana address
 * @param rpcUrl - RPC endpoint for the Solana network
 * @returns Transaction signature
 * @throws Error if transaction fails
 */
export async function sendSolanaTransaction({
  walletAccount,
  amount,
  recipient,
  rpcUrl,
}: SendSolanaTransactionParams): Promise<string> {
  // Build the transaction with current blockhash
  const transaction = await createSolanaTransaction({
    solanaWalletAccount: walletAccount,
    toAddress: recipient,
    amount,
    rpcUrl,
  });

  // Sign and broadcast via Dynamic SDK
  // Type assertion handles potential @solana/web3.js version mismatches
  const { signature } = await signAndSendTransaction({
    transaction: transaction as unknown as Parameters<
      typeof signAndSendTransaction
    >[0]["transaction"],
    walletAccount,
  });

  return signature;
}
