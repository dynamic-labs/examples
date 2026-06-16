import { useState } from "react";
import { createPublicClient, http } from "viem";

import { useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { createWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";

import { useToast } from "@/lib/toast-context";
import { UserWithdrawalRequest } from "@/lib/rain";
import { getAdminSignature } from "./get-admin-signature";
import { ADMIN_NONCE_ABI, WITHDRAW_ASSET_ABI } from "@/constants";

export interface UseWithdrawAssetOptions {
  onWithdrawSuccess?: () => void;
  onWithdrawError?: () => void;
}

export function useWithdrawAsset(options?: UseWithdrawAssetOptions) {
  const { walletAccounts } = useWalletAccounts();
  const { success } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const directTransfer = true;

  const withdrawAsset = async (
    coordinatorAddress: string,
    data: UserWithdrawalRequest
  ) => {
    const evmWallet = walletAccounts?.find(isEvmWalletAccount);
    if (!evmWallet) {
      throw new Error("Wallet not connected or not EVM compatible");
    }

    setIsLoading(true);

    const [
      collateralProxy,
      assetAddress,
      amountInCents,
      recipient,
      expiresAt,
      executorPublisherSalt,
      executorPublisherSig,
    ] = data.parameters;

    try {
      const walletClient = await createWalletClientForWalletAccount({ walletAccount: evmWallet });
      const publicClient = createPublicClient({ chain: evmWallet.network, transport: http() });

      const nonce = await publicClient.readContract({
        address: collateralProxy as `0x${string}`,
        abi: ADMIN_NONCE_ABI,
        functionName: "adminNonce",
      });

      const chainId = evmWallet.network?.id;
      if (!chainId) throw new Error("Network not found");

      // Generate admin signature
      const { salt: adminSalt, signature: adminSignature } =
        await getAdminSignature({
          walletClient,
          signerAddress: evmWallet.address,
          amount: Number(amountInCents),
          chainId: Number(chainId),
          collateralProxyAddress: collateralProxy,
          recipientAddress: recipient,
          tokenAddress: assetAddress,
          nonce: Number(nonce),
        });

      // Convert base64 salt to hex string for viem
      const saltBuffer = Buffer.from(executorPublisherSalt, "base64");
      const saltHex = `0x${saltBuffer.toString("hex")}` as `0x${string}`;

      const functionInputs = [
        collateralProxy,
        assetAddress,
        amountInCents,
        recipient,
        expiresAt,
        saltHex,
        executorPublisherSig,
        [adminSalt],
        [adminSignature],
        directTransfer,
      ];

      const hash = await walletClient.writeContract({
        address: coordinatorAddress as `0x${string}`,
        abi: WITHDRAW_ASSET_ABI,
        functionName: "withdrawAsset",
        args: functionInputs,
      });

      setTxHash(hash);

      // Wait for transaction receipt
      await publicClient.waitForTransactionReceipt({ hash });

      success("Withdrawal Confirmed");
      if (options?.onWithdrawSuccess) options.onWithdrawSuccess();
    } catch (error) {
      console.error("Failed to withdraw asset:", error);
      if (options?.onWithdrawError) options.onWithdrawError();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetWithdrawAsset = () => {
    setTxHash(null);
    setIsLoading(false);
  };

  return {
    isPending: isLoading,
    txHash,
    withdrawAsset,
    reset: resetWithdrawAsset,
  };
}
