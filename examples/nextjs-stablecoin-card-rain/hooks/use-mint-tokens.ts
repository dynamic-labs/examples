import { useState } from "react";

import {
  useDynamicContext,
  isEthereumWallet,
  isZeroDevConnector,
} from "@/lib/dynamic";
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
  const { primaryWallet, network } = useDynamicContext();
  const { success, error } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const mintTokens = async (mintOptions: MintOptions) => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      throw new Error("Wallet not connected or not EVM compatible");
    }

    if (!network) throw new Error("Network not found");
    const rusdcAddress = getContractAddress(network, "RUSDC");
    const { amountDollars } = mintOptions;

    try {
      setIsLoading(true);

      const walletClient = await primaryWallet.getWalletClient();

      // Use writeContract for ERC-20 transfers
      const hash = await walletClient.writeContract({
        address: rusdcAddress as `0x${string}`,
        abi: RUSDC_ABI,
        functionName: "mint",
        args: [BigInt(amountDollars)],
      });

      setTxHash(hash);

      const connector = primaryWallet.connector;
      if (!connector || !isZeroDevConnector(connector)) {
        throw new Error("Connector is not a ZeroDev connector");
      }
      const kernelClient = connector.getAccountAbstractionProvider();
      if (!kernelClient) throw new Error("Kernel client not found");
      await kernelClient.waitForUserOperationReceipt({ hash });

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
