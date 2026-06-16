import { useState } from "react";
import { createPublicClient, http } from "viem";

import { useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { createWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";
import { useToast } from "@/lib/toast-context";
import { getContractAddress, RUSDC_ABI } from "../constants";

export interface MintOptions {
  amountDollars: number;
}

export interface UseMintTokensOptions {
  onMintSuccess?: () => void;
  onMintError?: () => void;
}

export function useMintTokens(options?: UseMintTokensOptions) {
  const { walletAccounts } = useWalletAccounts();
  const { success, error } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const mintTokens = async (mintOptions: MintOptions) => {
    const evmWallet = walletAccounts?.find(isEvmWalletAccount);
    if (!evmWallet) {
      throw new Error("Wallet not connected or not EVM compatible");
    }

    const chainId = evmWallet.network?.id;
    if (!chainId) throw new Error("Network not found");
    const rusdcAddress = getContractAddress(chainId, "RUSDC");
    const { amountDollars } = mintOptions;

    try {
      setIsLoading(true);

      const walletClient = await createWalletClientForWalletAccount({ walletAccount: evmWallet });

      // Use writeContract for ERC-20 transfers
      const hash = await walletClient.writeContract({
        address: rusdcAddress as `0x${string}`,
        abi: RUSDC_ABI,
        functionName: "mint",
        args: [BigInt(amountDollars)],
      });

      setTxHash(hash);

      // Wait for transaction receipt
      const publicClient = createPublicClient({ chain: evmWallet.network, transport: http() });
      await publicClient.waitForTransactionReceipt({ hash });

      success(
        "Stablecoin Claimed",
        "Your balance will update in a few seconds"
      );
      if (options?.onMintSuccess) options.onMintSuccess();
    } catch (e: unknown) {
      console.log("MINT TOKENS ERROR", e);
      error("Transaction Failed");
      if (options?.onMintError) options.onMintError();
    } finally {
      setIsLoading(false);
    }
  };

  const resetMint = () => {
    setTxHash(null);
    setIsLoading(false);
  };

  return {
    isPending: isLoading,
    txHash,
    mintTokens,
    resetMint,
  };
}
