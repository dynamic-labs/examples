"use client";

import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet } from "@dynamic-labs/solana";
import {
  updateOrAppendSetComputeUnitLimitInstruction,
  updateOrAppendSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";
import { getAddMemoInstruction } from "@solana-program/memo";
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import {
  Base64EncodedWireTransaction,
  Blockhash,
  Instruction,
  MicroLamports,
  TransactionVersion,
  address,
  appendTransactionMessageInstructions,
  createNoopSigner,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  partiallySignTransactionMessageWithSigners,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import { KoraClient } from "@solana/kora";
import { createRecentSignatureConfirmationPromiseFactory } from "@solana/transaction-confirmation";
import { VersionedTransaction } from "@solana/web3.js";
import { useState, useEffect } from "react";

const CONFIG = {
  computeUnitLimit: 200_000,
  computeUnitPrice: BigInt(1_000_000) as MicroLamports,
  transactionVersion: 0 as TransactionVersion,
  solanaRpcUrl: "https://api.devnet.solana.com",
  solanaWsUrl: "wss://api.devnet.solana.com",
  koraRpcUrl: "http://localhost:8080/",
  tokenMintAddress: "5whA1qmcFkywQPoxsZ43185kzpeChAVbiRj2j5HanBZy",
};

export default function GaslessTransactionDemo() {
  const isLoggedIn = useIsLoggedIn();
  const { primaryWallet } = useDynamicContext();
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<
    string | null
  >(null);
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [tokenBalanceLoading, setTokenBalanceLoading] = useState(false);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
        setTokenBalance(null);
        return;
      }

      setTokenBalanceLoading(true);
      try {
        const rpc = createSolanaRpc(CONFIG.solanaRpcUrl);
        const mintAddress = address(CONFIG.tokenMintAddress);
        const ownerAddress = address(primaryWallet.address);

        const [ata] = await findAssociatedTokenPda({
          mint: mintAddress,
          owner: ownerAddress,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });

        const tokenAccountData = await rpc
          .getAccountInfo(ata, {
            encoding: "jsonParsed",
          })
          .send();

        if (
          tokenAccountData.value?.data &&
          "parsed" in tokenAccountData.value.data
        ) {
          const parsed = tokenAccountData.value.data.parsed as {
            info?: {
              tokenAmount?: {
                amount: string;
                decimals: number;
              };
            };
          };
          if (parsed.info?.tokenAmount) {
            const amount = parsed.info.tokenAmount.amount;
            const decimals = parsed.info.tokenAmount.decimals;
            const balance = Number(amount) / Math.pow(10, decimals);
            setTokenBalance(balance.toFixed(decimals > 6 ? 6 : decimals));
          } else {
            setTokenBalance("0");
          }
        } else {
          setTokenBalance("0");
        }
      } catch (error) {
        setTokenBalance("Error");
      } finally {
        setTokenBalanceLoading(false);
      }
    };

    fetchTokenBalance();
  }, [primaryWallet]);

  const handleGaslessTransaction = async () => {
    if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
      setStatus("Error: Solana wallet not available or not properly connected");
      return;
    }

    setLoading(true);
    setStatus("Initializing...");
    setTransactionSignature(null);

    try {
      setStatus("Connecting to Kora...");
      const koraClient = new KoraClient({
        rpcUrl: CONFIG.koraRpcUrl,
      });

      const rpc = createSolanaRpc(CONFIG.solanaRpcUrl);
      const rpcSubscriptions = createSolanaRpcSubscriptions(CONFIG.solanaWsUrl);
      const confirmTransaction =
        createRecentSignatureConfirmationPromiseFactory({
          rpc,
          rpcSubscriptions,
        });

      setStatus("Getting Kora signer...");
      const { signer_address } = await koraClient.getPayerSigner();
      const noopSigner = createNoopSigner(address(signer_address));

      setStatus("Getting payment token...");
      const config = await koraClient.getConfig();
      const paymentToken = config.validation_config.allowed_spl_paid_tokens[0];

      setStatus("Creating transaction...");
      const memoInstruction = getAddMemoInstruction({
        memo: "Hello from Dynamic + Kora gasless transaction!",
      });
      const instructions: Instruction[] = [memoInstruction];

      setStatus("Estimating fees...");
      const latestBlockhash = await koraClient.getBlockhash();

      const initialEstimateTransaction = pipe(
        createTransactionMessage({ version: CONFIG.transactionVersion }),
        (tx) => setTransactionMessageFeePayerSigner(noopSigner, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            {
              blockhash: latestBlockhash.blockhash as Blockhash,
              lastValidBlockHeight: BigInt(0),
            },
            tx
          ),
        (tx) =>
          updateOrAppendSetComputeUnitPriceInstruction(
            CONFIG.computeUnitPrice,
            tx
          ),
        (tx) =>
          updateOrAppendSetComputeUnitLimitInstruction(
            CONFIG.computeUnitLimit,
            tx
          ),
        (tx) => appendTransactionMessageInstructions(instructions, tx)
      );

      const signedInitialEstimate =
        await partiallySignTransactionMessageWithSigners(
          initialEstimateTransaction
        );
      const initialEstimateBase64 = getBase64EncodedWireTransaction(
        signedInitialEstimate
      );

      setStatus("Getting payment instruction...");
      const initialPaymentResponse = await koraClient.getPaymentInstruction({
        transaction: initialEstimateBase64,
        fee_token: paymentToken,
        source_wallet: primaryWallet.address,
      });
      let paymentInstruction: Instruction =
        initialPaymentResponse.payment_instruction;

      setStatus("Building final transaction...");
      const newBlockhash = await koraClient.getBlockhash();

      const fullTransaction = pipe(
        createTransactionMessage({ version: CONFIG.transactionVersion }),
        (tx) => setTransactionMessageFeePayerSigner(noopSigner, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            {
              blockhash: newBlockhash.blockhash as Blockhash,
              lastValidBlockHeight: BigInt(0),
            },
            tx
          ),
        (tx) =>
          updateOrAppendSetComputeUnitPriceInstruction(
            CONFIG.computeUnitPrice,
            tx
          ),
        (tx) =>
          updateOrAppendSetComputeUnitLimitInstruction(
            CONFIG.computeUnitLimit,
            tx
          ),
        (tx) =>
          appendTransactionMessageInstructions(
            [...instructions, paymentInstruction],
            tx
          )
      );

      setStatus("Re-estimating fees...");
      const finalEstimateTransaction =
        await partiallySignTransactionMessageWithSigners(fullTransaction);
      const finalEstimateBase64 = getBase64EncodedWireTransaction(
        finalEstimateTransaction
      );

      const finalPaymentResponse = await koraClient.getPaymentInstruction({
        transaction: finalEstimateBase64,
        fee_token: paymentToken,
        source_wallet: primaryWallet.address,
      });
      paymentInstruction = finalPaymentResponse.payment_instruction;

      const correctedFullTransaction = pipe(
        createTransactionMessage({ version: CONFIG.transactionVersion }),
        (tx) => setTransactionMessageFeePayerSigner(noopSigner, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            {
              blockhash: newBlockhash.blockhash as Blockhash,
              lastValidBlockHeight: BigInt(0),
            },
            tx
          ),
        (tx) =>
          updateOrAppendSetComputeUnitPriceInstruction(
            CONFIG.computeUnitPrice,
            tx
          ),
        (tx) =>
          updateOrAppendSetComputeUnitLimitInstruction(
            CONFIG.computeUnitLimit,
            tx
          ),
        (tx) =>
          appendTransactionMessageInstructions(
            [...instructions, paymentInstruction],
            tx
          )
      );

      setStatus("Signing transaction...");
      const signedFullTransaction =
        await partiallySignTransactionMessageWithSigners(
          correctedFullTransaction
        );

      const wireTransactionBase64 = getBase64EncodedWireTransaction(
        signedFullTransaction
      );
      const originalTransactionBytes = Buffer.from(
        wireTransactionBase64,
        "base64"
      );
      const originalTransaction = VersionedTransaction.deserialize(
        originalTransactionBytes
      );

      const message = originalTransaction.message;
      const numRequiredSignatures = message.header.numRequiredSignatures;
      const accountKeys = message.staticAccountKeys;
      const userAddress = primaryWallet.address;

      let userSignatureIndex = -1;
      for (
        let i = 0;
        i < numRequiredSignatures && i < accountKeys.length;
        i++
      ) {
        if (accountKeys[i].toBase58() === userAddress) {
          userSignatureIndex = i;
          break;
        }
      }

      if (userSignatureIndex === -1) {
        throw new Error(
          `User address ${userAddress} not found in transaction signers`
        );
      }

      const signer = await primaryWallet.getSigner();
      const signedTransaction = await signer.signTransaction(
        originalTransaction as any
      );

      const userSignature = signedTransaction.signatures[userSignatureIndex];
      if (!userSignature || userSignature.every((b: number) => b === 0)) {
        throw new Error("Failed to get signature from Dynamic wallet");
      }

      if (userSignature.length !== 64) {
        throw new Error(
          `Invalid signature length: expected 64 bytes, got ${userSignature.length}`
        );
      }

      const preservedTransaction = VersionedTransaction.deserialize(
        originalTransactionBytes
      );
      preservedTransaction.signatures[userSignatureIndex] = userSignature;

      const base64EncodedWireFullTransaction = Buffer.from(
        preservedTransaction.serialize()
      ).toString("base64");

      if (
        preservedTransaction.message.compiledInstructions.length <
        instructions.length + 1
      ) {
        throw new Error(
          `Transaction missing instructions. Expected at least ${
            instructions.length + 1
          }, got ${preservedTransaction.message.compiledInstructions.length}`
        );
      }

      setStatus("Getting Kora signature...");
      const { signed_transaction } = await koraClient.signTransaction({
        transaction: base64EncodedWireFullTransaction,
        signer_key: signer_address,
      });

      setStatus("Submitting to Solana network...");
      const signature = await rpc
        .sendTransaction(signed_transaction as Base64EncodedWireTransaction, {
          encoding: "base64",
        })
        .send();

      setTransactionSignature(signature);
      setStatus("Transaction submitted! Waiting for confirmation...");

      await confirmTransaction({
        commitment: "confirmed",
        signature,
        abortSignal: new AbortController().signal,
      });

      setStatus("✅ Transaction confirmed!");
    } catch (error) {
      setStatus(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 border rounded-lg space-y-4">
      <h2 className="text-2xl font-semibold">Gasless Transaction Demo</h2>
      <p className="text-sm text-muted-foreground">
        This demo sends a gasless transaction on Solana using Kora (a gasless
        relayer). The transaction fees are paid in SPL tokens instead of SOL.
      </p>

      <div className="space-y-2">
        <div className="text-sm">
          <strong>Wallet:</strong>{" "}
          {primaryWallet && isSolanaWallet(primaryWallet)
            ? primaryWallet.address
            : "Not connected"}
        </div>
        <div className="text-sm">
          <strong>Kora RPC:</strong> {CONFIG.koraRpcUrl}
        </div>
        <div className="text-sm">
          <strong>Solana RPC:</strong> {CONFIG.solanaRpcUrl}
        </div>
        {primaryWallet && isSolanaWallet(primaryWallet) && (
          <div className="text-sm">
            <strong>
              Token Balance ({CONFIG.tokenMintAddress.slice(0, 8)}...):
            </strong>{" "}
            {tokenBalanceLoading ? (
              <span className="text-gray-500">Loading...</span>
            ) : tokenBalance !== null ? (
              `${tokenBalance} tokens`
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleGaslessTransaction}
        disabled={
          !isLoggedIn ||
          !primaryWallet ||
          !isSolanaWallet(primaryWallet) ||
          loading
        }
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : "Send Gasless Transaction"}
      </button>

      {status && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm">
          <strong>Status:</strong> {status}
        </div>
      )}

      {transactionSignature && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded text-sm">
          <strong>Transaction Signature:</strong>
          <div className="mt-2 break-all font-mono text-xs">
            {transactionSignature}
          </div>
          <a
            href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-blue-600 hover:underline"
          >
            View on Solana Explorer →
          </a>
        </div>
      )}
    </div>
  );
}
