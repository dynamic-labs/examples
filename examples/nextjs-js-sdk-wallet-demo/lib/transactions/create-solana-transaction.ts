"use client";

import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import type { SolanaWalletAccount } from "@/lib/dynamic";

// =============================================================================
// TYPES
// =============================================================================

interface CreateSolanaTransactionParams {
  solanaWalletAccount: SolanaWalletAccount;
  toAddress: string;
  amount: string;
  rpcUrl: string;
}

// =============================================================================
// CREATE SOLANA TRANSACTION
// =============================================================================

/**
 * Create a Solana versioned transaction for native SOL transfer
 */
export async function createSolanaTransaction({
  solanaWalletAccount,
  toAddress,
  amount,
  rpcUrl,
}: CreateSolanaTransactionParams): Promise<VersionedTransaction> {
  const connection = new Connection(rpcUrl, "confirmed");

  const fromPublicKey = new PublicKey(solanaWalletAccount.address);
  const toPublicKey = new PublicKey(toAddress);

  // Convert SOL amount to lamports
  const lamports = Math.floor(parseFloat(amount) * 1_000_000_000);

  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash("finalized");

  // Create transfer instruction
  const instruction = SystemProgram.transfer({
    fromPubkey: fromPublicKey,
    toPubkey: toPublicKey,
    lamports,
  });

  // Create versioned transaction
  const message = new TransactionMessage({
    payerKey: fromPublicKey,
    recentBlockhash: blockhash,
    instructions: [instruction],
  }).compileToV0Message();

  return new VersionedTransaction(message);
}
