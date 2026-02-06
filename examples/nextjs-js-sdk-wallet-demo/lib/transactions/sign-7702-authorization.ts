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
import {
  authenticateTotpMfaDevice,
  getMfaDevices,
  signEip7702Authorization,
  type EvmWalletAccount,
  type NetworkData,
} from "@/lib/dynamic-client";

// Re-export the type for consumers
export type { SignAuthorizationReturnType };

// =============================================================================
// SIGN AUTHORIZATION
// =============================================================================

export interface Sign7702Params {
  /** The ZeroDev smart wallet account to sign for */
  walletAccount: EvmWalletAccount;
  /** The network to sign for */
  networkData: NetworkData;
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
  mfaCode,
}: Sign7702Params): Promise<SignAuthorizationReturnType> {
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

    // 2. Sign the EIP-7702 authorization using the SDK abstraction
    const signedAuth = await signEip7702Authorization({
      smartWalletAccount: walletAccount,
      networkId: networkData.networkId,
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
