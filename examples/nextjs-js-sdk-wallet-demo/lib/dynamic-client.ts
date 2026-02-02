"use client";

/**
 * Dynamic SDK Client Module
 *
 * This module provides a singleton Dynamic client with SSR-safe wrappers
 * for all SDK functions. It handles the complexity of Next.js server/client
 * rendering while providing a clean API for the rest of the application.
 *
 * ## Architecture
 *
 * 1. **Singleton Pattern**: Single client instance created lazily on first access
 * 2. **SSR Safety**: All exports are safe to import in any component
 * 3. **Wrapper Strategies**: Different approaches based on function requirements
 *
 * ## Wrapper Strategies
 *
 * We use three strategies depending on the function's requirements:
 *
 * ### 1. `createSafeWrapper` - Synchronous functions with fallback
 * Used for sync functions that should return a safe default on SSR/error.
 * Example: `isSignedIn()` returns `false` if client unavailable.
 *
 * ### 2. `createAsyncSafeWrapper` - Async functions that throw on SSR
 * Used for async functions that require an initialized client.
 * These throw an error if called before client is ready.
 *
 * ### 3. Custom implementations - Functions needing special logic
 * Used when we need:
 * - Specific fallback values (not just throw)
 * - Pre-flight checks like `waitForClientInitialized`
 * - Try/catch with custom error handling
 *
 * ### 4. Direct re-exports - Pure functions without client dependency
 * Used for type guards and utilities that don't need the client instance.
 *
 * @see https://www.dynamic.xyz/docs/javascript-sdk
 */

import {
  createDynamicClient,
  type DynamicClient,
  type WalletAccount,
  type NetworkData,
  type OTPVerification,
  type VerifyResponse,
  type Chain,
  logout as sdkLogout,
  isSignedIn as sdkIsSignedIn,
  getWalletAccounts as sdkGetWalletAccounts,
  getNetworksData as sdkGetNetworksData,
  getActiveNetworkData as sdkGetActiveNetworkData,
  switchActiveNetwork as sdkSwitchActiveNetwork,
  sendEmailOTP as sdkSendEmailOTP,
  verifyOTP as sdkVerifyOTP,
  authenticateWithSocial as sdkAuthenticateWithSocial,
  detectOAuthRedirect as sdkDetectOAuthRedirect,
  completeSocialAuthentication as sdkCompleteSocialAuthentication,
  onEvent as sdkOnEvent,
  offEvent as sdkOffEvent,
  waitForClientInitialized as sdkWaitForClientInitialized,
  getWalletProviderDataByKey as sdkGetWalletProviderDataByKey,
} from "@dynamic-labs-sdk/client";

import {
  createWaasWalletAccounts as sdkCreateWaasWalletAccounts,
  isWaasWalletAccount as sdkIsWaasWalletAccount,
} from "@dynamic-labs-sdk/client/waas";

import {
  addEvmExtension,
  isEvmWalletAccount as sdkIsEvmWalletAccount,
  type EvmWalletAccount,
} from "@dynamic-labs-sdk/evm";
import { createWalletClientForWalletAccount as sdkCreateWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";

import {
  addSolanaExtension,
  isSolanaWalletAccount as sdkIsSolanaWalletAccount,
  signAndSendTransaction as sdkSignAndSendTransaction,
  type SolanaWalletAccount,
} from "@dynamic-labs-sdk/solana";

import {
  addZerodevExtension,
  createKernelClientForWalletAccount as sdkCreateKernelClientForWalletAccount,
  isGasSponsorshipError as sdkIsGasSponsorshipError,
  canSponsorTransaction as sdkCanSponsorTransaction,
} from "@dynamic-labs-sdk/zerodev";

// =============================================================================
// SINGLETON CLIENT
// =============================================================================

let _client: DynamicClient | null = null;

/**
 * Get or create the Dynamic client instance (singleton)
 *
 * Creates the client on first access and adds all required extensions.
 * Returns null during SSR (server-side rendering).
 */
function getClient(): DynamicClient | null {
  // SSR guard - window is undefined on server
  if (typeof window === "undefined") return null;

  if (!_client) {
    _client = createDynamicClient({
      environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
      autoInitialize: true,
      metadata: {
        name: "JS SDK Wallet Demo",
      },
    });

    // Add chain extensions for EVM, Solana, and ZeroDev (gas sponsorship)
    addEvmExtension(_client);
    addSolanaExtension(_client);
    addZerodevExtension(_client);
  }

  return _client;
}

// =============================================================================
// WRAPPER FACTORIES
// =============================================================================

/**
 * Creates an SSR-safe wrapper for synchronous SDK functions.
 *
 * Returns the fallback value if:
 * - Running on server (SSR)
 * - Client not initialized
 * - Function throws an error
 *
 * @param fn - The SDK function to wrap
 * @param fallback - Value to return when function can't execute
 */
function createSafeWrapper<T>(fn: () => T, fallback: T): () => T {
  return () => {
    const client = getClient();
    if (!client) return fallback;
    try {
      return fn();
    } catch {
      return fallback;
    }
  };
}

/**
 * Creates an SSR-safe wrapper for async SDK functions.
 *
 * Throws an error if client is not initialized. Use this for
 * operations that should only happen after client is ready.
 *
 * @param fn - The async SDK function to wrap
 */
function createAsyncSafeWrapper<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const client = getClient();
    if (!client) throw new Error("Dynamic client not initialized");
    return fn(...args);
  };
}

// =============================================================================
// AUTH FUNCTIONS
// =============================================================================

/**
 * Check if user is currently signed in.
 * Returns false during SSR or if client unavailable.
 */
export const isSignedIn = createSafeWrapper(sdkIsSignedIn, false);

/**
 * Log out the current user.
 * Safe to call even if not logged in.
 */
export async function logout(): Promise<void> {
  const client = getClient();
  if (!client) return;
  return sdkLogout();
}

// =============================================================================
// EMAIL OTP AUTHENTICATION
// These require waitForClientInitialized to ensure auth state is ready
// =============================================================================

/**
 * Send OTP code to user's email.
 * Waits for client initialization before sending.
 */
export async function sendEmailOTP(params: {
  email: string;
}): Promise<OTPVerification> {
  const client = getClient();
  if (!client) throw new Error("Dynamic client not initialized");

  // Ensure client is fully initialized before auth operations
  await sdkWaitForClientInitialized(client);
  return sdkSendEmailOTP(params);
}

/**
 * Verify the OTP code entered by user.
 * Waits for client initialization before verifying.
 */
export async function verifyOTP(params: {
  otpVerification: OTPVerification;
  verificationToken: string;
}): Promise<VerifyResponse> {
  const client = getClient();
  if (!client) throw new Error("Dynamic client not initialized");

  await sdkWaitForClientInitialized(client);
  return sdkVerifyOTP(params);
}

// =============================================================================
// SOCIAL AUTHENTICATION
// =============================================================================

/** Initiate social auth flow (redirects to provider) */
export const authenticateWithSocial = createAsyncSafeWrapper(
  sdkAuthenticateWithSocial,
);

/**
 * Detect OAuth redirect from social provider.
 * Safe to call during SSR - just checks URL params.
 */
export const detectOAuthRedirect = sdkDetectOAuthRedirect;

/** Complete social auth after redirect back from provider */
export const completeSocialAuthentication = createAsyncSafeWrapper(
  sdkCompleteSocialAuthentication,
);

// =============================================================================
// WALLET ACCOUNTS
// =============================================================================

/**
 * Get all wallet accounts for the current user.
 * Returns empty array during SSR.
 */
export const getWalletAccounts = createSafeWrapper(sdkGetWalletAccounts, []);

/**
 * Create new WaaS (embedded) wallet accounts.
 * User must be authenticated.
 */
export async function createWaasWalletAccounts(params: {
  chains: Chain[];
}): Promise<void> {
  const client = getClient();
  if (!client) throw new Error("Dynamic client not initialized");
  return sdkCreateWaasWalletAccounts(params);
}

/**
 * Check if a wallet account is a WaaS (embedded) wallet.
 * Returns false during SSR.
 */
export function isWaasWalletAccount(params: {
  walletAccount: WalletAccount;
}): boolean {
  const client = getClient();
  if (!client) return false;
  return sdkIsWaasWalletAccount(params);
}

// =============================================================================
// NETWORKS
// =============================================================================

/**
 * Get all enabled networks from Dynamic dashboard config.
 * Returns empty array during SSR.
 */
export const getNetworksData = createSafeWrapper(sdkGetNetworksData, []);

/**
 * Get the active network for a wallet account.
 * Returns undefined networkData during SSR or on error.
 */
export async function getActiveNetworkData(params: {
  walletAccount: WalletAccount;
}): Promise<{ networkData: NetworkData | undefined }> {
  const client = getClient();
  if (!client) return { networkData: undefined };

  try {
    return await sdkGetActiveNetworkData(params);
  } catch {
    return { networkData: undefined };
  }
}

/**
 * Switch the active network for a wallet account.
 */
export const switchActiveNetwork = createAsyncSafeWrapper(
  sdkSwitchActiveNetwork,
);

// =============================================================================
// WALLET PROVIDER DATA
// =============================================================================

/**
 * Get wallet provider metadata by key.
 * Returns null during SSR or on error.
 */
export async function getWalletProviderDataByKey(params: {
  walletProviderKey: string;
}) {
  const client = getClient();
  if (!client) return null;

  try {
    return sdkGetWalletProviderDataByKey(params);
  } catch {
    return null;
  }
}

// =============================================================================
// CHAIN TYPE GUARDS
// These are pure functions that check wallet account types.
// Safe to use directly - they don't require client instance.
// =============================================================================

/** Check if wallet account is EVM-compatible */
export const isEvmWalletAccount = sdkIsEvmWalletAccount;

/** Check if wallet account is Solana */
export const isSolanaWalletAccount = sdkIsSolanaWalletAccount;

// =============================================================================
// EVM TRANSACTIONS (via viem)
// =============================================================================

/**
 * Create a viem WalletClient for an EVM wallet account.
 * Use this to send transactions on EVM chains.
 *
 * @see https://viem.sh/docs/clients/wallet
 */
export const createWalletClientForWalletAccount =
  sdkCreateWalletClientForWalletAccount;

// =============================================================================
// ZERODEV (Account Abstraction & Gas Sponsorship)
// =============================================================================

/**
 * Create a ZeroDev kernel client for gas-sponsored transactions.
 *
 * @see https://docs.zerodev.app
 */
export const createKernelClientForWalletAccount =
  sdkCreateKernelClientForWalletAccount;

/**
 * Check if an error is due to gas sponsorship being unavailable.
 * Use this to implement fallback to user-paid gas.
 */
export const isGasSponsorshipError = sdkIsGasSponsorshipError;

/**
 * Check if a transaction can be sponsored by the configured paymaster.
 *
 * Use this to determine if the user will need to pay gas fees
 * or if the transaction qualifies for gas sponsorship.
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/zerodev/can-sponsor-transaction
 */
export const canSponsorTransaction = sdkCanSponsorTransaction;

// =============================================================================
// SOLANA TRANSACTIONS
// =============================================================================

/**
 * Sign and send a Solana transaction.
 * The wallet account must be a Solana wallet.
 */
export const signAndSendTransaction = sdkSignAndSendTransaction;

// =============================================================================
// SDK EVENTS
// Subscribe to SDK events for reactive updates.
// =============================================================================

/**
 * Subscribe to a Dynamic SDK event.
 *
 * @example
 * ```ts
 * const unsub = onEvent({
 *   event: "walletAccountsChanged",
 *   listener: () => refetchWallets()
 * });
 * // Later: unsub();
 * ```
 *
 * @see https://www.dynamic.xyz/docs/javascript-sdk/wallets/wallet-provider-events
 */
export const onEvent = sdkOnEvent;

/** Unsubscribe from a Dynamic SDK event */
export const offEvent = sdkOffEvent;

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

/** Possible initialization states for the Dynamic client */
export type InitStatus =
  | "uninitialized"
  | "in-progress"
  | "finished"
  | "failed";

/**
 * Get current client initialization status.
 * Returns "uninitialized" during SSR.
 */
export function getInitStatus(): InitStatus {
  const client = getClient();
  if (!client) return "uninitialized";
  return client.initStatus as InitStatus;
}

/**
 * Wait for client to finish initializing.
 * Useful before operations that require full client state.
 */
export async function waitForClientInitialized(): Promise<void> {
  const client = getClient();
  if (!client) return;
  return sdkWaitForClientInitialized(client);
}

// =============================================================================
// TYPE EXPORTS
// Re-export commonly used types for convenience.
// =============================================================================

export type {
  WalletAccount,
  NetworkData,
  OTPVerification,
  EvmWalletAccount,
  SolanaWalletAccount,
  Chain,
};
