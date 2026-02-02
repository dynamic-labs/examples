"use client";

/**
 * EVM Transaction Handler
 *
 * Sends transactions on EVM-compatible chains.
 * Wallet selection and sponsorship checks are handled by useGasSponsorship hook.
 *
 * For ZeroDev wallets: Uses kernel client (supports gas sponsorship)
 * For base wallets: Uses viem wallet client (direct transaction)
 */

import { parseEther } from "viem";
import {
  type EvmWalletAccount,
  type NetworkData,
  createWalletClientForWalletAccount,
  createKernelClientForWalletAccount,
  switchActiveNetwork,
} from "@/lib/dynamic-client";

// =============================================================================
// TYPES
// =============================================================================

export interface SendEvmTransactionParams {
  walletAccount: EvmWalletAccount;
  amount: string;
  recipient: string;
  networkData: NetworkData;
}

// =============================================================================
// EVM TRANSACTION
// =============================================================================

/**
 * Send an EVM transaction
 *
 * @returns Transaction hash
 */
export async function sendEvmTransaction({
  walletAccount,
  amount,
  recipient,
  networkData,
}: SendEvmTransactionParams): Promise<string> {
  const tx = {
    to: recipient as `0x${string}`,
    value: parseEther(amount),
  };

  // Ensure wallet is on correct network
  await switchActiveNetwork({
    networkId: networkData.networkId,
    walletAccount,
  });

  // ZeroDev wallet - use kernel client
  if (walletAccount.walletProviderKey.includes("zerodev")) {
    const kernelClient = await createKernelClientForWalletAccount({
      smartWalletAccount: walletAccount,
    });
    return await kernelClient.sendTransaction(tx);
  }

  // Base wallet - use viem wallet client
  const walletClient = await createWalletClientForWalletAccount({
    walletAccount,
  });
  return await walletClient.sendTransaction(tx);
}
