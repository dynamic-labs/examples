"use client";

import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import type { SolanaWalletAccount } from "@/lib/dynamic";

// =============================================================================
// TYPES
// =============================================================================

interface CreateSolanaTokenTransactionParams {
  solanaWalletAccount: SolanaWalletAccount;
  /** Recipient Solana address */
  toAddress: string;
  /** Amount in token units (e.g., "1.5" for 1.5 USDC) */
  amount: string;
  /** Solana RPC endpoint URL */
  rpcUrl: string;
  /** SPL token address */
  tokenMintAddress: string;
  /** Token decimals (e.g., 6 for USDC, 9 for most SPL tokens) */
  tokenDecimals: number;
}

// =============================================================================
// CREATE SOLANA TOKEN TRANSACTION
// =============================================================================

/**
 * Create a Solana versioned transaction for SPL token transfer
 *
 * Handles:
 * - Creating the recipient's associated token account if it doesn't exist
 * - Building the transfer instruction with proper decimal handling
 */
export async function createSolanaTokenTransaction({
  solanaWalletAccount,
  toAddress,
  amount,
  rpcUrl,
  tokenMintAddress,
  tokenDecimals,
}: CreateSolanaTokenTransactionParams): Promise<VersionedTransaction> {
  const connection = new Connection(rpcUrl, "confirmed");

  const fromPublicKey = new PublicKey(solanaWalletAccount.address);
  const toPublicKey = new PublicKey(toAddress);
  const mintPublicKey = new PublicKey(tokenMintAddress);

  // Get associated token accounts for sender and recipient
  const senderTokenAccount = await getAssociatedTokenAddress(
    mintPublicKey,
    fromPublicKey,
  );
  const recipientTokenAccount = await getAssociatedTokenAddress(
    mintPublicKey,
    toPublicKey,
  );

  // Convert amount to token base units using decimals
  const tokenAmount = BigInt(
    Math.floor(parseFloat(amount) * 10 ** tokenDecimals),
  );

  const instructions = [];

  // Check if recipient's token account exists, create if not
  const recipientTokenInfo = await connection.getAccountInfo(
    recipientTokenAccount,
  );

  if (!recipientTokenInfo) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        fromPublicKey, // payer (sender pays for account creation)
        recipientTokenAccount,
        toPublicKey,
        mintPublicKey,
      ),
    );
  }

  // Add SPL token transfer instruction
  instructions.push(
    createTransferCheckedInstruction(
      senderTokenAccount,
      mintPublicKey,
      recipientTokenAccount,
      fromPublicKey,
      tokenAmount,
      tokenDecimals,
    ),
  );

  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash("finalized");

  // Create versioned transaction
  const message = new TransactionMessage({
    payerKey: fromPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  return new VersionedTransaction(message);
}
