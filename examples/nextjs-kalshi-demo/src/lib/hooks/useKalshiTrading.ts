"use client";

import { useState, useCallback, useRef } from "react";
import { useDynamicContext, isSolanaWallet } from "@/lib/dynamic";
import {
  Connection,
  PublicKey,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// Token mint addresses on Solana mainnet
const SOL_MINT = "11111111111111111111111111111111";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// DFlow Trade API configuration
const DFLOW_API_BASE_URL = "https://quote-api.dflow.net";

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
  getSolBalance: () => Promise<number>;
  getUsdcBalance: () => Promise<number>;
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

        // Build query parameters for DFlow API
        const queryParams = new URLSearchParams();
        queryParams.append("inputMint", inputMint);
        queryParams.append("outputMint", outputMint);
        queryParams.append("amount", amount.toString());
        queryParams.append("slippageBps", slippageBps.toString());
        queryParams.append("userPublicKey", walletAddress);

        // Optional API key header
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        const apiKey = process.env.NEXT_PUBLIC_DFLOW_API_KEY;
        if (apiKey) {
          headers["x-api-key"] = apiKey;
        }

        // Get order transaction from DFlow
        const orderResponse = await fetch(
          `${DFLOW_API_BASE_URL}/order?${queryParams.toString()}`,
          { headers }
        );

        if (!orderResponse.ok) {
          const errorText = await orderResponse.text();
          throw new Error(`DFlow API error: ${errorText}`);
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
          // For async mode, poll the order status
          let attempts = 0;
          const maxAttempts = 30;

          while (attempts < maxAttempts) {
            const statusResponse = await fetch(
              `${DFLOW_API_BASE_URL}/order-status?signature=${signature}`,
              { headers }
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
   * Swap SOL to USDC using DFlow
   */
  const swapSolToUsdc = useCallback(
    async (
      solAmount: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      // Convert SOL to lamports
      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
      return executeDFlowSwap(SOL_MINT, USDC_MINT, lamports);
    },
    [executeDFlowSwap]
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
        // Check SOL balance first
        const solBalance = await getSolBalance();

        // Estimate SOL needed (rough estimate based on current SOL price ~$200)
        // In production, you'd fetch the actual price from an oracle
        const estimatedSolNeeded = params.amount / 200;

        if (solBalance < estimatedSolNeeded + 0.01) {
          // +0.01 SOL for fees
          setIsLoading(false);
          return {
            success: false,
            error: `Insufficient SOL balance. You have ${solBalance.toFixed(
              4
            )} SOL but need approximately ${estimatedSolNeeded.toFixed(
              4
            )} SOL plus fees.`,
          };
        }

        // Convert USD amount to lamports (assuming ~$200/SOL for demo)
        // In production, fetch real-time price
        const lamportsToSwap = Math.floor(
          (params.amount / 200) * LAMPORTS_PER_SOL
        );

        // Use DFlow to swap SOL to USDC (which would then be used to buy prediction tokens)
        // In a real implementation, this would swap directly to the prediction market outcome token
        const result = await executeDFlowSwap(
          SOL_MINT,
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
    [primaryWallet, getSolBalance, executeDFlowSwap]
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
        // In a real implementation, this would swap the outcome token back to USDC or SOL
        // For demo purposes, we simulate selling by swapping a small amount
        const lamportsToSwap = Math.floor(params.size * 1000000); // Convert to smallest units

        const result = await executeDFlowSwap(
          params.tokenMint || USDC_MINT,
          SOL_MINT,
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
    getSolBalance,
    getUsdcBalance,
    isLoading,
    isSelling,
    error,
  };
}
