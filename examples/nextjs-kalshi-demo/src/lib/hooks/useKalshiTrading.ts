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
} from "@solana/web3.js";
import {
  NATIVE_MINT,
  getAssociatedTokenAddress,
  createSyncNativeInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
} from "@solana/spl-token";

// Token mint addresses on Solana mainnet
const WSOL_MINT = "So11111111111111111111111111111111111111112"; // Wrapped SOL
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Slippage tolerance in basis points (50 = 0.5%)
const DEFAULT_SLIPPAGE_BPS = 50;

export interface TradeParams {
  marketId: string;
  ticker: string;
  tokenMint?: string;
  side: "yes" | "no";
  amount: number; // Amount in USD
  price?: number;
  isMarketOrder?: boolean;
}

export interface SellParams {
  marketId: string;
  tokenMint?: string;
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
      connectionRef.current = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
        "confirmed"
      );
    }
    return connectionRef.current;
  }, []);

  const getSolBalance = useCallback(async (): Promise<number> => {
    // Get address directly from primaryWallet to avoid stale closure
    const walletAddress = primaryWallet?.address;
    console.log(
      "getSolBalance called, primaryWallet:",
      !!primaryWallet,
      "address:",
      walletAddress
    );

    if (!primaryWallet || !walletAddress) {
      console.warn("getSolBalance: No wallet or address available");
      return 0;
    }

    try {
      const connection = getConnection();
      const publicKey = new PublicKey(walletAddress);
      console.log("Fetching balance for:", walletAddress);
      const balance = await connection.getBalance(publicKey);
      console.log("SOL balance in lamports:", balance);
      console.log("SOL balance:", balance / LAMPORTS_PER_SOL);
      return balance / LAMPORTS_PER_SOL;
    } catch (err) {
      console.error("Failed to get SOL balance:", err);
      return 0;
    }
  }, [primaryWallet, getConnection]);

  const getUsdcBalance = useCallback(async (): Promise<number> => {
    const walletAddress = primaryWallet?.address;
    if (!primaryWallet || !walletAddress) {
      return 0;
    }

    try {
      const connection = getConnection();
      const publicKey = new PublicKey(walletAddress);
      const usdcMint = new PublicKey(USDC_MINT);

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: usdcMint }
      );

      if (tokenAccounts.value.length > 0) {
        const balance =
          tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        return balance || 0;
      }

      return 0;
    } catch (err) {
      console.error("Failed to get USDC balance:", err);
      return 0;
    }
  }, [primaryWallet, getConnection]);

  const getWsolBalance = useCallback(async (): Promise<number> => {
    const walletAddress = primaryWallet?.address;
    if (!primaryWallet || !walletAddress) {
      return 0;
    }

    try {
      const connection = getConnection();
      const publicKey = new PublicKey(walletAddress);

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: NATIVE_MINT }
      );

      if (tokenAccounts.value.length > 0) {
        const balance =
          tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        console.log("WSOL balance:", balance);
        return balance || 0;
      }

      return 0;
    } catch (err) {
      console.error("Failed to get WSOL balance:", err);
      return 0;
    }
  }, [primaryWallet, getConnection]);

  /**
   * Wrap native SOL into WSOL
   * Creates ATA if needed, transfers SOL to it, and syncs the balance
   */
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
        const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

        // Get the associated token account for WSOL
        const ata = await getAssociatedTokenAddress(NATIVE_MINT, publicKey);

        const transaction = new Transaction();

        // Check if ATA exists, if not create it
        try {
          await getAccount(connection, ata);
          console.log("WSOL ATA already exists:", ata.toBase58());
        } catch (error) {
          if (error instanceof TokenAccountNotFoundError) {
            console.log("Creating WSOL ATA:", ata.toBase58());
            transaction.add(
              createAssociatedTokenAccountInstruction(
                publicKey, // payer
                ata, // ata
                publicKey, // owner
                NATIVE_MINT // mint
              )
            );
          } else {
            throw error;
          }
        }

        // Transfer SOL to the ATA
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: ata,
            lamports,
          })
        );

        // Sync the wrapped SOL balance
        transaction.add(createSyncNativeInstruction(ata));

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Sign and send transaction
        const signer = await primaryWallet.getSigner();
        const signedTx = await signer.signTransaction(
          transaction as unknown as Parameters<typeof signer.signTransaction>[0]
        );

        const signature = await connection.sendRawTransaction(
          signedTx.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          }
        );

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        );

        if (confirmation.value.err) {
          throw new Error(
            `Wrap SOL failed: ${JSON.stringify(confirmation.value.err)}`
          );
        }

        console.log("SOL wrapped successfully:", signature);
        return { success: true, txHash: signature };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to wrap SOL";
        console.error("Wrap SOL error:", err);
        return { success: false, error: errorMessage };
      }
    },
    [primaryWallet, getConnection]
  );

  /**
   * Execute a swap using DFlow Trade API
   */
  const executeDFlowSwap = useCallback(
    async (
      inputMint: string,
      outputMint: string,
      amount: number,
      slippageBps: number = DEFAULT_SLIPPAGE_BPS
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

        // Build query parameters for DFlow API proxy
        const queryParams = new URLSearchParams();
        queryParams.append("endpoint", "order");
        queryParams.append("inputMint", inputMint);
        queryParams.append("outputMint", outputMint);
        queryParams.append("amount", amount.toString());
        queryParams.append("slippageBps", slippageBps.toString());
        queryParams.append("userPublicKey", walletAddress);

        // Get order transaction via our proxy (API key is handled server-side)
        const orderResponse = await fetch(
          `/api/dflow?${queryParams.toString()}`
        );

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(errorData.error || "DFlow API error");
        }

        const orderData: DFlowOrderResponse = await orderResponse.json();

        // Deserialize the transaction from base64
        const transactionBuffer = Buffer.from(orderData.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(transactionBuffer);

        // Get the signer from Dynamic wallet and sign the transaction
        // Cast via unknown to handle version mismatch between Dynamic's @solana/web3.js and ours
        const signer = await primaryWallet.getSigner();
        const signedTx = await signer.signTransaction(
          transaction as unknown as Parameters<typeof signer.signTransaction>[0]
        );

        // Send the transaction to Solana
        const signature = await connection.sendRawTransaction(
          signedTx.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          }
        );

        // Handle based on execution mode
        if (orderData.executionMode === "sync") {
          // For sync mode, wait for transaction confirmation
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
          // For async mode, poll the order status via our proxy
          let attempts = 0;
          const maxAttempts = 30;

          while (attempts < maxAttempts) {
            const statusParams = new URLSearchParams();
            statusParams.append("endpoint", "order-status");
            statusParams.append("signature", signature);

            const statusResponse = await fetch(
              `/api/dflow?${statusParams.toString()}`
            );

            if (!statusResponse.ok) {
              throw new Error("Failed to get order status");
            }

            const statusData: DFlowOrderStatus = await statusResponse.json();

            if (statusData.status === "closed") {
              return { success: true, txHash: signature };
            } else if (statusData.status === "failed") {
              throw new Error("Order failed to execute");
            }

            // Wait before polling again
            await new Promise((resolve) => setTimeout(resolve, 2000));
            attempts++;
          }

          throw new Error("Order timed out");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Swap failed";
        console.error("DFlow swap error:", err);
        return { success: false, error: errorMessage };
      }
    },
    [primaryWallet, getConnection]
  );

  /**
   * Swap WSOL to USDC using DFlow
   * Will wrap SOL first if needed
   */
  const swapSolToUsdc = useCallback(
    async (
      solAmount: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      // Check WSOL balance first
      const wsolBalance = await getWsolBalance();

      if (wsolBalance < solAmount) {
        const solBalance = await getSolBalance();
        const wsolNeeded = solAmount - wsolBalance;

        if (solBalance < wsolNeeded + 0.01) {
          return {
            success: false,
            error: `Insufficient balance. You have ${solBalance.toFixed(
              4
            )} SOL and ${wsolBalance.toFixed(4)} WSOL.`,
          };
        }

        // Wrap SOL first
        const wrapResult = await wrapSol(wsolNeeded + 0.001);
        if (!wrapResult.success) {
          return {
            success: false,
            error: `Failed to wrap SOL: ${wrapResult.error}`,
          };
        }
      }

      // Convert SOL to lamports and swap WSOL to USDC
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

      setIsLoading(true);
      setError(null);

      try {
        // Estimate SOL needed (rough estimate based on current SOL price ~$200)
        // In production, you'd fetch the actual price from an oracle
        const estimatedSolNeeded = params.amount / 200;
        const lamportsToSwap = Math.floor(
          estimatedSolNeeded * LAMPORTS_PER_SOL
        );

        // Check WSOL balance first
        const wsolBalance = await getWsolBalance();
        console.log(
          `WSOL balance: ${wsolBalance}, needed: ${estimatedSolNeeded}`
        );

        // If WSOL balance is insufficient, we need to wrap SOL first
        if (wsolBalance < estimatedSolNeeded) {
          const solBalance = await getSolBalance();
          const wsolNeeded = estimatedSolNeeded - wsolBalance;

          // Check if we have enough native SOL to wrap
          if (solBalance < wsolNeeded + 0.01) {
            // +0.01 SOL for fees
            setIsLoading(false);
            return {
              success: false,
              error: `Insufficient SOL balance. You have ${solBalance.toFixed(
                4
              )} SOL and ${wsolBalance.toFixed(
                4
              )} WSOL but need approximately ${estimatedSolNeeded.toFixed(
                4
              )} SOL total plus fees.`,
            };
          }

          console.log(`Wrapping ${wsolNeeded.toFixed(4)} SOL to WSOL...`);
          const wrapResult = await wrapSol(wsolNeeded + 0.001); // Add small buffer for rounding

          if (!wrapResult.success) {
            setIsLoading(false);
            return {
              success: false,
              error: `Failed to wrap SOL: ${wrapResult.error}`,
            };
          }

          console.log("SOL wrapped successfully, proceeding with trade...");
        }

        // Now execute the swap using WSOL
        // Use DFlow to swap WSOL to the target token
        const result = await executeDFlowSwap(
          WSOL_MINT,
          params.tokenMint || USDC_MINT,
          lamportsToSwap
        );

        setIsLoading(false);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to place order";
        console.error("Trading error:", err);
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

      setIsSelling(true);
      setError(null);

      try {
        // In a real implementation, this would swap the outcome token back to USDC or WSOL
        // For demo purposes, we simulate selling by swapping a small amount
        const lamportsToSwap = Math.floor(params.size * 1000000); // Convert to smallest units

        const result = await executeDFlowSwap(
          params.tokenMint || USDC_MINT,
          WSOL_MINT,
          lamportsToSwap
        );

        setIsSelling(false);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to sell position";
        console.error("Sell error:", err);
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
