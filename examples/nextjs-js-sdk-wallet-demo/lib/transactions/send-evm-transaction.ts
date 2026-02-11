"use client";

/**
 * EVM Transaction Handler
 *
 * Sends transactions on EVM-compatible chains (native ETH and ERC-20 tokens).
 * Wallet selection and sponsorship checks are handled by useGasSponsorship hook.
 *
 * For ZeroDev wallets:
 * - Uses kernel client (supports gas sponsorship)
 * - Accepts EIP-7702 authorization if provided (for first tx after signing)
 * - Requires MFA authentication if user has MFA device configured
 *
 * For base wallets: Uses viem wallet client (direct transaction, no MFA)
 *
 * Token transfers use the ERC-20 `transfer` function via `writeContract`.
 */

import { parseEther, parseUnits, encodeFunctionData, erc20Abi } from "viem";
import type { SignAuthorizationReturnType } from "viem/accounts";
import {
  type EvmWalletAccount,
  type NetworkData,
  createWalletClientForWalletAccount,
  createKernelClientForWalletAccount,
  switchActiveNetwork,
  authenticateTotpMfaDevice,
  getMfaDevices,
} from "@/lib/dynamic";

// =============================================================================
// TYPES
// =============================================================================

export interface SendEvmTransactionParams {
  walletAccount: EvmWalletAccount;
  amount: string;
  recipient: string;
  networkData: NetworkData;
  /** TOTP code for MFA-protected transactions (ZeroDev only) */
  mfaCode?: string;
  /** EIP-7702 authorization (for first tx after signing smart account) */
  eip7702Auth?: SignAuthorizationReturnType;
  /** ERC-20 token contract address (omit for native ETH transfer) */
  tokenAddress?: string;
  /** Token decimals (e.g., 6 for USDC, 18 for most ERC-20 tokens) */
  tokenDecimals?: number;
}

// =============================================================================
// EVM TRANSACTION
// =============================================================================

/**
 * Build the transaction object for either native or ERC-20 token transfer
 */
function buildEvmTransaction({
  recipient,
  amount,
  tokenAddress,
  tokenDecimals,
}: {
  recipient: string;
  amount: string;
  tokenAddress?: string;
  tokenDecimals?: number;
}) {
  // ERC-20 token transfer
  if (tokenAddress) {
    const decimals = tokenDecimals ?? 18;
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [recipient as `0x${string}`, parseUnits(amount, decimals)],
    });

    return {
      to: tokenAddress as `0x${string}`,
      data,
      value: BigInt(0),
    };
  }

  // Native ETH transfer
  return {
    to: recipient as `0x${string}`,
    value: parseEther(amount),
  };
}

/**
 * Send an EVM transaction (native ETH or ERC-20 token transfer)
 *
 * For ZeroDev wallets:
 * - Authenticates MFA with singleUse: true (1 signature only)
 * - If EIP-7702 auth provided, passes to kernel client
 * - Sends transaction
 *
 * @returns Transaction hash
 */
export async function sendEvmTransaction({
  walletAccount,
  amount,
  recipient,
  networkData,
  mfaCode,
  eip7702Auth,
  tokenAddress,
  tokenDecimals,
}: SendEvmTransactionParams): Promise<string> {
  const tx = buildEvmTransaction({
    recipient,
    amount,
    tokenAddress,
    tokenDecimals,
  });

  // Ensure wallet is on correct network
  await switchActiveNetwork({
    networkId: networkData.networkId,
    walletAccount,
  });

  // ZeroDev wallet - authenticate MFA first, then use kernel client
  if (walletAccount.walletProviderKey.includes("zerodev")) {
    // Authenticate MFA if code provided and user has device
    if (mfaCode) {
      const devices = await getMfaDevices();

      if (devices.length > 0) {
        await authenticateTotpMfaDevice({
          code: mfaCode,
          createMfaTokenOptions: { singleUse: true },
        });
      }
    }

    // Create kernel client with auth (if available)
    const kernelClient = await createKernelClientForWalletAccount({
      smartWalletAccount: walletAccount,
      eip7702Auth,
    });

    return await kernelClient.sendTransaction(tx);
  }

  // Base wallet - use viem wallet client (no MFA)
  const walletClient = await createWalletClientForWalletAccount({
    walletAccount,
  });
  return await walletClient.sendTransaction(tx);
}
