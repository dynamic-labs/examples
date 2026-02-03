"use client";

import { useState, useCallback, useRef } from "react";
import { useDynamicContext, isSolanaWallet } from "@/lib/dynamic";
import {
  Connection,
  PublicKey,
  VersionedTransaction,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionMessage,
} from "@solana/web3.js";
import {
  NATIVE_MINT,
  getAssociatedTokenAddress,
  createSyncNativeInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import {
  WSOL_MINT,
  USDC_MINT,
  DEFAULT_SLIPPAGE_BPS,
  MIN_BET_USD,
  SOL_PRICE_ESTIMATE,
  TX_FEE_RESERVE,
  SOLANA_RPC_URL,
} from "@/lib/constants";

export interface TradeParams {
  marketId: string;
  ticker: string;
  tokenMint?: string;
  side: "yes" | "no";
  amount: number;
  price?: number;
  isMarketOrder?: boolean;
}

export interface SellParams {
  marketId: string;
  tokenMint?: string;
  settlementMint?: string;
  side: "yes" | "no";
  size: number;
  price?: number;
  isMarketOrder?: boolean;
}

interface DFlowOrderResponse {
  transaction: string;
  executionMode: "sync" | "async";
}

interface DFlowOrderStatus {
  status: "open" | "closed" | "pendingClose" | "failed";
  fills?: Array<{ amount: number; price: number }>;
}

export interface UseKalshiTradingReturn {
  placeOrder: (
    params: TradeParams
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  sellPosition: (
    params: SellParams
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  swapSolToUsdc: (
    solAmount: number
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  wrapSol: (
    solAmount: number
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  getSolBalance: () => Promise<number>;
  getUsdcBalance: () => Promise<number>;
  getWsolBalance: () => Promise<number>;
  isLoading: boolean;
  isSelling: boolean;
  error: string | null;
}

export function useKalshiTrading(): UseKalshiTradingReturn {
  const { primaryWallet } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<Connection | null>(null);

  const getConnection = useCallback((): Connection => {
    if (!connectionRef.current) {
      connectionRef.current = new Connection(SOLANA_RPC_URL, "confirmed");
    }
    return connectionRef.current;
  }, []);

  const getSolBalance = useCallback(async (): Promise<number> => {
    const walletAddress = primaryWallet?.address;
    if (!primaryWallet || !walletAddress) return 0;

    try {
      const connection = getConnection();
      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch {
      return 0;
    }
  }, [primaryWallet, getConnection]);

  const getUsdcBalance = useCallback(async (): Promise<number> => {
    const walletAddress = primaryWallet?.address;
    if (!primaryWallet || !walletAddress) return 0;

    try {
      const connection = getConnection();
      const publicKey = new PublicKey(walletAddress);
      const usdcMint = new PublicKey(USDC_MINT);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: usdcMint }
      );

      if (tokenAccounts.value.length > 0) {
        return (
          tokenAccounts.value[0].account.data.parsed.info.tokenAmount
            .uiAmount || 0
        );
      }
      return 0;
    } catch {
      return 0;
    }
  }, [primaryWallet, getConnection]);

  const getWsolBalance = useCallback(async (): Promise<number> => {
    const walletAddress = primaryWallet?.address;
    if (!primaryWallet || !walletAddress) return 0;

    try {
      const connection = getConnection();
      const publicKey = new PublicKey(walletAddress);
      const wsolMint = new PublicKey(WSOL_MINT);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: wsolMint }
      );

      if (tokenAccounts.value.length > 0) {
        return (
          tokenAccounts.value[0].account.data.parsed.info.tokenAmount
            .uiAmount || 0
        );
      }
      return 0;
    } catch {
      return 0;
    }
  }, [primaryWallet, getConnection]);

  const wrapSol = useCallback(
    async (
      solAmount: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      const walletAddress = primaryWallet?.address;
      if (!walletAddress || !primaryWallet) {
        return { success: false, error: "Wallet not connected" };
      }

      if (!isSolanaWallet(primaryWallet)) {
        return { success: false, error: "Please connect a Solana wallet" };
      }

      try {
        const connection = getConnection();
        const publicKey = new PublicKey(walletAddress);
        const wsolAta = await getAssociatedTokenAddress(NATIVE_MINT, publicKey);
        const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

        const transaction = new Transaction();

        let ataExists = false;
        try {
          await getAccount(connection, wsolAta);
          ataExists = true;
        } catch (e) {
          if (!(e instanceof TokenAccountNotFoundError)) throw e;
        }

        if (!ataExists) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              wsolAta,
              publicKey,
              NATIVE_MINT
            )
          );
        }

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: wsolAta,
            lamports,
          })
        );

        transaction.add(createSyncNativeInstruction(wsolAta));

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Convert legacy Transaction to VersionedTransaction for Dynamic wallet compatibility
        const messageV0 = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: blockhash,
          instructions: transaction.instructions,
        }).compileToV0Message();

        const versionedTransaction = new VersionedTransaction(messageV0);

        const signer = await primaryWallet.getSigner();
        const signedTx = await signer.signTransaction(
          versionedTransaction as unknown as Parameters<
            typeof signer.signTransaction
          >[0]
        );

        const signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        return { success: true, txHash: signature };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to wrap SOL",
        };
      }
    },
    [primaryWallet, getConnection]
  );

  const executeDFlowSwap = useCallback(
    async (
      inputMint: string,
      outputMint: string,
      amount: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      const walletAddress = primaryWallet?.address;
      if (!walletAddress || !primaryWallet) {
        return { success: false, error: "Wallet not connected" };
      }

      if (!isSolanaWallet(primaryWallet)) {
        return { success: false, error: "Please connect a Solana wallet" };
      }

      try {
        const connection = getConnection();

        const queryParams = new URLSearchParams();
        queryParams.append("endpoint", "order");
        queryParams.append("inputMint", inputMint);
        queryParams.append("outputMint", outputMint);
        queryParams.append("amount", amount.toString());
        queryParams.append("slippageBps", DEFAULT_SLIPPAGE_BPS.toString());
        queryParams.append("userPublicKey", walletAddress);

        const orderResponse = await fetch(
          `/api/dflow?${queryParams.toString()}`
        );

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(errorData.error || "DFlow API error");
        }

        const orderData: DFlowOrderResponse = await orderResponse.json();

        const transactionBuffer = Buffer.from(orderData.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(transactionBuffer);

        const signer = await primaryWallet.getSigner();
        const signedTx = await signer.signTransaction(
          transaction as unknown as Parameters<typeof signer.signTransaction>[0]
        );

        const signature = await connection.sendRawTransaction(
          signedTx.serialize(),
          { skipPreflight: false, preflightCommitment: "confirmed" }
        );

        if (orderData.executionMode === "sync") {
          const confirmation = await connection.confirmTransaction(
            {
              signature,
              blockhash: transaction.message.recentBlockhash,
              lastValidBlockHeight: (
                await connection.getLatestBlockhash()
              ).lastValidBlockHeight,
            },
            "confirmed"
          );

          if (confirmation.value.err) {
            throw new Error(
              `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
            );
          }

          return { success: true, txHash: signature };
        } else {
          // Async mode - poll for status
          let attempts = 0;
          const maxAttempts = 30;

          while (attempts < maxAttempts) {
            const statusParams = new URLSearchParams();
            statusParams.append("endpoint", "order-status");
            statusParams.append("signature", signature);

            const statusResponse = await fetch(
              `/api/dflow?${statusParams.toString()}`
            );

            if (statusResponse.status === 404) {
              // Order not found - check on-chain
              const txStatus = await connection.getSignatureStatus(signature);
              if (
                txStatus.value?.confirmationStatus === "confirmed" ||
                txStatus.value?.confirmationStatus === "finalized"
              ) {
                if (!txStatus.value.err) {
                  return { success: true, txHash: signature };
                } else {
                  throw new Error("Transaction failed on-chain");
                }
              }
              await new Promise((resolve) => setTimeout(resolve, 2000));
              attempts++;
              continue;
            }

            if (!statusResponse.ok) {
              throw new Error("Failed to get order status");
            }

            const statusData: DFlowOrderStatus = await statusResponse.json();

            if (statusData.status === "closed") {
              return { success: true, txHash: signature };
            } else if (statusData.status === "failed") {
              throw new Error("Order failed to execute");
            }

            await new Promise((resolve) => setTimeout(resolve, 2000));
            attempts++;
          }

          // Final on-chain check
          const finalStatus = await connection.getSignatureStatus(signature);
          if (finalStatus.value?.confirmationStatus && !finalStatus.value.err) {
            return { success: true, txHash: signature };
          }

          throw new Error("Order timed out");
        }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Swap failed",
        };
      }
    },
    [primaryWallet, getConnection]
  );

  const swapSolToUsdc = useCallback(
    async (
      solAmount: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      const wsolBalance = await getWsolBalance();

      if (wsolBalance < solAmount) {
        const solBalance = await getSolBalance();
        const wsolNeeded = solAmount - wsolBalance;

        if (solBalance < wsolNeeded + TX_FEE_RESERVE) {
          return {
            success: false,
            error: `Insufficient balance. You have ${solBalance.toFixed(
              4
            )} SOL and ${wsolBalance.toFixed(4)} WSOL.`,
          };
        }

        const wrapResult = await wrapSol(wsolNeeded + 0.001);
        if (!wrapResult.success) {
          return {
            success: false,
            error: `Failed to wrap SOL: ${wrapResult.error}`,
          };
        }
      }

      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
      return executeDFlowSwap(WSOL_MINT, USDC_MINT, lamports);
    },
    [executeDFlowSwap, getWsolBalance, getSolBalance, wrapSol]
  );

  const placeOrder = useCallback(
    async (
      params: TradeParams
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      const walletAddress = primaryWallet?.address;
      if (!walletAddress || !primaryWallet) {
        return { success: false, error: "Wallet not connected" };
      }

      if (!isSolanaWallet(primaryWallet)) {
        return { success: false, error: "Please connect a Solana wallet" };
      }

      if (!params.tokenMint) {
        return {
          success: false,
          error:
            "This market does not have a valid outcome token. Cannot place order.",
        };
      }

      if (params.amount < MIN_BET_USD) {
        return {
          success: false,
          error: `Minimum bet is $${MIN_BET_USD}. Please increase your bet amount.`,
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        const solBalance = await getSolBalance();
        const wsolBalance = await getWsolBalance();
        const totalBalance = solBalance + wsolBalance;

        const baseSolNeeded = params.amount / SOL_PRICE_ESTIMATE;
        const estimatedSolNeeded = baseSolNeeded * 1.2 + TX_FEE_RESERVE;

        if (totalBalance < estimatedSolNeeded) {
          const maxBetUsd = Math.floor(
            ((totalBalance - TX_FEE_RESERVE) * SOL_PRICE_ESTIMATE) / 1.2
          );
          setIsLoading(false);
          return {
            success: false,
            error: `Insufficient balance. You have ${totalBalance.toFixed(
              4
            )} SOL total but need ~${estimatedSolNeeded.toFixed(
              4
            )} SOL. Max bet: ~$${Math.max(0, maxBetUsd)}.`,
          };
        }

        const lamportsToSwap = Math.floor(
          baseSolNeeded * 1.2 * LAMPORTS_PER_SOL
        );

        if (wsolBalance < baseSolNeeded * 1.2) {
          const wsolNeeded = baseSolNeeded * 1.2 - wsolBalance;

          if (solBalance < wsolNeeded + TX_FEE_RESERVE) {
            setIsLoading(false);
            return {
              success: false,
              error: `Insufficient SOL to wrap. Have ${solBalance.toFixed(
                4
              )} SOL, need ${(wsolNeeded + TX_FEE_RESERVE).toFixed(4)} SOL.`,
            };
          }

          const wrapResult = await wrapSol(wsolNeeded + 0.002);
          if (!wrapResult.success) {
            setIsLoading(false);
            return {
              success: false,
              error: `Failed to wrap SOL: ${wrapResult.error}`,
            };
          }
        }

        const result = await executeDFlowSwap(
          WSOL_MINT,
          params.tokenMint,
          lamportsToSwap
        );

        setIsLoading(false);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to place order";
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [primaryWallet, getSolBalance, getWsolBalance, wrapSol, executeDFlowSwap]
  );

  const sellPosition = useCallback(
    async (
      params: SellParams
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      const walletAddress = primaryWallet?.address;
      if (!walletAddress || !primaryWallet) {
        return { success: false, error: "Wallet not connected" };
      }

      if (!isSolanaWallet(primaryWallet)) {
        return { success: false, error: "Please connect a Solana wallet" };
      }

      if (!params.tokenMint) {
        return {
          success: false,
          error:
            "Position does not have a valid outcome token mint. Cannot sell.",
        };
      }

      setIsSelling(true);
      setError(null);

      try {
        // Sell outcome tokens back to settlement currency (USDC by default)
        const outputMint = params.settlementMint || USDC_MINT;
        const amountToSwap = Math.floor(params.size * 1000000);
        const result = await executeDFlowSwap(
          params.tokenMint,
          outputMint,
          amountToSwap
        );

        setIsSelling(false);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to sell position";
        setError(errorMessage);
        setIsSelling(false);
        return { success: false, error: errorMessage };
      }
    },
    [primaryWallet, executeDFlowSwap]
  );

  return {
    placeOrder,
    sellPosition,
    swapSolToUsdc,
    wrapSol,
    getSolBalance,
    getUsdcBalance,
    getWsolBalance,
    isLoading,
    isSelling,
    error,
  };
}
