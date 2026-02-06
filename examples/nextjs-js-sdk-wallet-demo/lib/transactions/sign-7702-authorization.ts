"use client";

/**
 * EIP-7702 Authorization Signing
 *
 * Signs the EIP-7702 authorization to enable smart account features.
 * This ONLY signs the authorization - it does NOT send a transaction.
 *
 * The signed authorization is returned and should be passed to the
 * kernel client when sending the first transaction on this network.
 *
 * Flow:
 * 1. User clicks "Enable Smart Account" - signs auth (1 MFA, singleUse: true)
 * 2. Auth is passed to send-tx screen via callback
 * 3. User sends transaction - kernel client uses the auth (1 MFA, singleUse: true)
 *
 * Each action requires only 1 MFA code.
 */

import type { SignAuthorizationReturnType } from "viem/accounts";
import { constants } from "@zerodev/sdk";
import {
  authenticateTotpMfaDevice,
  createWalletClientForWalletAccount,
  getMfaDevices,
  switchActiveNetwork,
  type EvmWalletAccount,
  type NetworkData,
  type WalletAccount,
} from "@/lib/dynamic-client";
import { getBaseWalletForAddress } from "@/lib/wallet-utils";

// Re-export the type for consumers
export type { SignAuthorizationReturnType };

// =============================================================================
// SIGN AUTHORIZATION
// =============================================================================

export interface Sign7702Params {
  /** The ZeroDev wallet account to sign for */
  walletAccount: EvmWalletAccount;
  /** The network to sign for */
  networkData: NetworkData;
  /** All wallet accounts (needed to find the base WaaS wallet for signing) */
  allWalletAccounts: WalletAccount[];
  /** TOTP code from authenticator app */
  mfaCode?: string;
}

/**
 * Sign EIP-7702 authorization for a wallet
 *
 * This ONLY signs the authorization - no transaction is sent.
 * The signed authorization should be passed to sendEvmTransaction
 * when sending the first transaction on this network.
 *
 * Requires only 1 MFA code (singleUse: true).
 *
 * @returns The signed authorization
 */
export async function sign7702Authorization({
  walletAccount,
  networkData,
  allWalletAccounts,
  mfaCode,
}: Sign7702Params): Promise<SignAuthorizationReturnType> {
  const chainId = Number(networkData.networkId);

  // Find the base WaaS wallet (required for signing - ZeroDev wallet can't sign directly)
  const baseWallet = getBaseWalletForAddress(
    walletAccount.address,
    allWalletAccounts,
  );

  if (!baseWallet) {
    throw new Error(
      "Base WaaS wallet not found. Cannot sign EIP-7702 authorization.",
    );
  }

  try {
    // 1. Authenticate MFA if provided (singleUse: true - only 1 signature needed)
    if (mfaCode) {
      const devices = await getMfaDevices();

      if (devices.length > 0) {
        await authenticateTotpMfaDevice({
          code: mfaCode,
          createMfaTokenOptions: { singleUse: true },
        });
      }
    }

    // 2. Ensure we're on the correct network (use base wallet for network switching)
    await switchActiveNetwork({
      networkId: networkData.networkId,
      walletAccount: baseWallet,
    });

    // 3. Sign the EIP-7702 authorization using the base WaaS wallet
    const walletClient = await createWalletClientForWalletAccount({
      walletAccount: baseWallet as EvmWalletAccount,
    });

    if (!walletClient.signAuthorization) {
      throw new Error(
        "signAuthorization not available. Only WaaS wallets support EIP-7702.",
      );
    }

    // Use viem's signAuthorization - it handles nonce fetching automatically
    const signedAuth = await walletClient.signAuthorization({
      account: walletClient.account,
      contractAddress: constants.KERNEL_7702_DELEGATION_ADDRESS,
      chainId,
    });

    return signedAuth;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("No MFA token")) {
      throw new Error(
        "MFA authentication required. Please enter your authenticator code.",
      );
    }

    if (
      errorMessage.toLowerCase().includes("mfa") ||
      errorMessage.toLowerCase().includes("authentication")
    ) {
      throw new Error(`MFA error: ${errorMessage}`);
    }

    throw error;
  }
}
