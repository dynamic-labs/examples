import { useState } from "react";
import { parseUnits, erc20Abi, createPublicClient, http } from "viem";

import { useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { createWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";
import { useToast } from "@/lib/toast-context";

export interface DepositTokenOptions {
  amount: string;
  token: string;
  to: string;
  decimals?: number;
}

export interface UseDepositTokenOptions {
  onDepositSuccess?: () => void;
}

export function useDepositToken(options?: UseDepositTokenOptions) {
  const { walletAccounts } = useWalletAccounts();
  const { success } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const depositToken = async (depositOptions: DepositTokenOptions) => {
    const { amount, token, to, decimals = 18 } = depositOptions;

    const evmWallet = walletAccounts?.find(isEvmWalletAccount);
    if (!evmWallet) {
      throw new Error("Wallet not connected or not EVM compatible");
    }

    setIsLoading(true);

    try {
      const walletClient = await createWalletClientForWalletAccount({ walletAccount: evmWallet });

      // Convert amount to token units based on decimals
      const amountInUnits = parseUnits(amount, decimals);

      // Use writeContract for ERC-20 transfers
      const hash = await walletClient.writeContract({
        address: token as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [to as `0x${string}`, amountInUnits],
      });

      setTxHash(hash);

      // Wait for transaction receipt
      const publicClient = createPublicClient({ chain: evmWallet.network, transport: http() });
      await publicClient.waitForTransactionReceipt({ hash });

      success(
        "Deposit Processing",
        "Your balances will update in a few seconds"
      );
      if (options?.onDepositSuccess) options.onDepositSuccess();
    } catch (error) {
      console.error("Failed to transfer token:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetDeposit = () => {
    setTxHash(null);
    setIsLoading(false);
  };

  return {
    isPending: isLoading,
    txHash,
    depositToken,
    resetDeposit,
  };
}
