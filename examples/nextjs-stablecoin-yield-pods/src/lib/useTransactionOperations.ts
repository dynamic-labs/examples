import { useState } from "react";
import { WalletClient } from "viem";
import { client as podsClient, Strategy } from "./pods";

export function useTransactionOperations(
  walletClient: WalletClient | null,
  selectedChainId: number
) {
  const [isOperating, setIsOperating] = useState(false);
  const [operationError, setOperationError] = useState<Error | null>(null);

  const executeDeposit = async (
    strategy: Strategy,
    amount: string // Amount in human-readable format (e.g., "1.5")
  ) => {
    if (!walletClient?.account?.address) {
      throw new Error("Wallet not connected");
    }

    setIsOperating(true);
    setOperationError(null);

    try {
      // Convert amount to smallest unit (with decimals)
      const decimals = strategy.assetDecimals;
      const amountInSmallestUnit = BigInt(
        Math.floor(parseFloat(amount) * 10 ** decimals)
      ).toString();

      // Get bytecode from Pods API
      const { bytecode } = await podsClient.getDepositBytecode({
        strategyId: strategy.id,
        chainId: selectedChainId,
        amount: amountInSmallestUnit,
        asset: strategy.assetName,
        wallet: walletClient.account.address,
      });

      // Execute all transactions in the bytecode array
      let lastHash: string | undefined;
      for (const tx of bytecode) {
        const hash = await walletClient.sendTransaction({
          chain: undefined,
          account: walletClient.account,
          to: tx.to as `0x${string}`,
          value: BigInt(tx.value),
          data: tx.data as `0x${string}`,
        });
        lastHash = hash;
      }

      return lastHash;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setOperationError(err);
      throw err;
    } finally {
      setIsOperating(false);
    }
  };

  const executeWithdraw = async (
    strategy: Strategy,
    amount: string // Amount in human-readable format (e.g., "1.5")
  ) => {
    if (!walletClient?.account?.address) {
      throw new Error("Wallet not connected");
    }

    setIsOperating(true);
    setOperationError(null);

    try {
      // Convert amount to smallest unit (with decimals)
      const decimals = strategy.assetDecimals;
      const amountInSmallestUnit = BigInt(
        Math.floor(parseFloat(amount) * 10 ** decimals)
      ).toString();

      // Get bytecode from Pods API
      const { bytecode } = await podsClient.getWithdrawBytecode({
        strategyId: strategy.id,
        chainId: selectedChainId,
        amount: amountInSmallestUnit,
        asset: strategy.assetName,
        wallet: walletClient.account.address,
      });

      // Execute all transactions in the bytecode array
      let lastHash: string | undefined;
      for (const tx of bytecode) {
        const hash = await walletClient.sendTransaction({
          account: walletClient.account!,
          to: tx.to as `0x${string}`,
          value: BigInt(tx.value),
          data: tx.data as `0x${string}`,
        } as Parameters<typeof walletClient.sendTransaction>[0]);

        lastHash = hash;
      }

      return lastHash;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setOperationError(err);
      throw err;
    } finally {
      setIsOperating(false);
    }
  };

  return {
    isOperating,
    operationError,
    executeDeposit,
    executeWithdraw,
  };
}
