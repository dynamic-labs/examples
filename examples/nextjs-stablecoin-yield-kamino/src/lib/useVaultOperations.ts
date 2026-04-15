"use client";

import { useState } from "react";
import { signAllTransactions } from "@dynamic-labs-sdk/solana";
import { Connection, VersionedTransaction, SendTransactionError } from "@solana/web3.js";
import {
  createSolanaRpc,
  createNoopSigner,
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  partiallySignTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
  type TransactionSigner,
} from "@solana/kit";
import { KaminoVault, type DepositIxs, type WithdrawIxs } from "@kamino-finance/klend-sdk";
import { Decimal } from "decimal.js";
import { useWallet } from "./providers";
import { dynamicClient } from "./dynamic";

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;

interface PreparedTransaction {
  unsigned: VersionedTransaction;
  blockhash: string;
  lastValidBlockHeight: bigint;
}

// Build one unsigned transaction. Each call fetches a fresh finalized blockhash so
// "Blockhash not found" can't occur during preflight simulation.
async function prepareTransaction(
  instructions: Parameters<typeof appendTransactionMessageInstructions>[0],
  noopSigner: TransactionSigner
): Promise<PreparedTransaction> {
  const rpc = createSolanaRpc(SOLANA_RPC_URL);
  const { value: latestBlockhash } = await rpc
    .getLatestBlockhash({ commitment: "finalized" })
    .send();

  const txMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(noopSigner, tx),
    (tx) =>
      setTransactionMessageLifetimeUsingBlockhash(
        {
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        tx
      ),
    (tx) => appendTransactionMessageInstructions(instructions, tx)
  );

  const compiled = await partiallySignTransactionMessageWithSigners(txMessage);
  const wireBase64 = getBase64EncodedWireTransaction(compiled);
  return {
    unsigned: VersionedTransaction.deserialize(Buffer.from(wireBase64, "base64")),
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  };
}

async function sendAndConfirm(
  tx: VersionedTransaction,
  blockhash: string,
  lastValidBlockHeight: bigint
): Promise<string> {
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");
  let txHash: string;
  try {
    txHash = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
  } catch (err) {
    if (err instanceof SendTransactionError) {
      // err.logs is already populated from preflight — don't call err.getLogs(connection),
      // which calls getTransaction('') and throws "Invalid param: WrongSize".
      const logs = err.logs ?? [];
      if (logs.find((l) => l.includes("insufficient lamports"))) {
        throw new Error(
          "Insufficient SOL balance to create a token account. Add more SOL to your wallet and try again."
        );
      }
      throw new Error(logs.join("\n") || err.message);
    }
    throw err;
  }
  // Blockhash-based confirmation is more reliable than the deprecated string overload.
  await connection.confirmTransaction(
    { signature: txHash, blockhash, lastValidBlockHeight: Number(lastValidBlockHeight) },
    "confirmed"
  );
  return txHash;
}

export function useVaultOperations() {
  const { solanaAccount } = useWallet();
  const [isOperating, setIsOperating] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  const executeDeposit = async (
    vaultAddress: string,
    amount: number
  ): Promise<string | undefined> => {
    if (!solanaAccount) return;
    setIsOperating(true);
    setOperationError(null);

    try {
      const rpc = createSolanaRpc(SOLANA_RPC_URL);
      const noopSigner = createNoopSigner(address(solanaAccount.address));
      const vault = new KaminoVault(rpc, address(vaultAddress));
      const depositIxs: DepositIxs = await vault.depositIxs(noopSigner, new Decimal(amount));

      const groups = [
        depositIxs.depositIxs,
        depositIxs.stakeInFarmIfNeededIxs,
        depositIxs.stakeInFlcFarmIfNeededIxs,
      ].filter((g) => g.length > 0);

      if (groups.length === 0) return;

      // Build all transactions in parallel (independent blockhash fetches),
      // sign them in one MPC round, then send+confirm sequentially.
      const prepared = await Promise.all(groups.map((g) => prepareTransaction(g, noopSigner)));
      const { signedTransactions } = await signAllTransactions(
        { transactions: prepared.map((p) => p.unsigned), walletAccount: solanaAccount },
        dynamicClient
      );

      let lastHash: string | undefined;
      for (let i = 0; i < signedTransactions.length; i++) {
        const { blockhash, lastValidBlockHeight } = prepared[i];
        lastHash = await sendAndConfirm(
          signedTransactions[i] as VersionedTransaction,
          blockhash,
          lastValidBlockHeight
        );
      }
      return lastHash;
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : "Deposit failed");
      throw err;
    } finally {
      setIsOperating(false);
    }
  };

  const executeWithdraw = async (
    vaultAddress: string,
    shares: number
  ): Promise<string | undefined> => {
    if (!solanaAccount) return;
    setIsOperating(true);
    setOperationError(null);

    try {
      const rpc = createSolanaRpc(SOLANA_RPC_URL);
      const noopSigner = createNoopSigner(address(solanaAccount.address));
      const vault = new KaminoVault(rpc, address(vaultAddress));
      const withdrawIxs: WithdrawIxs = await vault.withdrawIxs(
        noopSigner,
        new Decimal(shares)
      );

      const groups = [
        withdrawIxs.unstakeFromFarmIfNeededIxs,
        withdrawIxs.withdrawIxs,
        withdrawIxs.postWithdrawIxs,
      ].filter((g) => g.length > 0);

      if (groups.length === 0) return;

      const prepared = await Promise.all(groups.map((g) => prepareTransaction(g, noopSigner)));
      const { signedTransactions } = await signAllTransactions(
        { transactions: prepared.map((p) => p.unsigned), walletAccount: solanaAccount },
        dynamicClient
      );

      let lastHash: string | undefined;
      for (let i = 0; i < signedTransactions.length; i++) {
        const { blockhash, lastValidBlockHeight } = prepared[i];
        lastHash = await sendAndConfirm(
          signedTransactions[i] as VersionedTransaction,
          blockhash,
          lastValidBlockHeight
        );
      }
      return lastHash;
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : "Withdraw failed");
      throw err;
    } finally {
      setIsOperating(false);
    }
  };

  return { isOperating, operationError, executeDeposit, executeWithdraw };
}
