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
 * @see https://dynamic.xyz/docs/javascript/reference/quickstart
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
  authenticateTotpMfaDevice as sdkAuthenticateTotpMfaDevice,
  getMfaDevices as sdkGetMfaDevices,
  registerTotpMfaDevice as sdkRegisterTotpMfaDevice,
  isMfaRequiredForAction as sdkIsMfaRequiredForAction,
  getBalance as sdkGetBalance,
  MFAAction,
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
  signEip7702Authorization as sdkSignEip7702Authorization,
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

/**
 * Get the native token balance for a wallet account.
 * Returns the balance as a string (e.g., "1.5" ETH/SOL) or null if unavailable.
 *
 * @param walletAccount - The wallet account to get the balance for
 * @returns Object containing balance string or null
 *
 * @example
 * ```ts
 * const { balance } = await getBalance({ walletAccount });
 * if (balance) {
 *   console.log(`Balance: ${balance} ${networkData.nativeCurrency.symbol}`);
 * }
 * ```
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/wallets/get-balance
 */
export async function getBalance(params: {
  walletAccount: WalletAccount;
}): Promise<{ balance: string | null }> {
  const client = getClient();
  if (!client) return { balance: null };

  try {
    return await sdkGetBalance(params);
  } catch {
    return { balance: null };
  }
}

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
 * @see https://www.dynamic.xyz/docs/javascript/reference/evm/getting-viem-wallet-client#page-title
 */
export const createWalletClientForWalletAccount =
  sdkCreateWalletClientForWalletAccount;

// =============================================================================
// ZERODEV (Account Abstraction & Gas Sponsorship)
// =============================================================================

/**
 * Create a ZeroDev kernel client for gas-sponsored transactions.
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/zerodev/create-kernel-client-for-wallet-account
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

/**
 * Sign an EIP-7702 authorization for a smart wallet account.
 *
 * The SDK handles finding the underlying WaaS wallet, creating the wallet client,
 * and signing the authorization for ZeroDev kernel delegation.
 *
 * The signed authorization can then be passed to `createKernelClientForWalletAccount`
 * via the `eip7702Auth` parameter.
 *
 * @param smartWalletAccount - The ZeroDev smart wallet account to sign for
 * @param networkId - The network ID to scope the authorization to
 * @returns The signed authorization object
 *
 * @example
 * ```ts
 * const auth = await signEip7702Authorization({
 *   smartWalletAccount: zerodevWallet,
 *   networkId: networkData.networkId,
 * });
 * // Pass to kernel client
 * ```
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/zerodev
 */
export const signEip7702Authorization = createAsyncSafeWrapper(
  sdkSignEip7702Authorization,
);

// =============================================================================
// SOLANA TRANSACTIONS
// =============================================================================

/**
 * Sign and send a Solana transaction.
 * The wallet account must be a Solana wallet.
 */
export const signAndSendTransaction = sdkSignAndSendTransaction;

// =============================================================================
// MFA (Multi-Factor Authentication)
// Used for action-based MFA to protect sensitive operations like transactions
// =============================================================================

/**
 * Authenticate with a TOTP (Time-based One-Time Password) MFA device.
 *
 * Use this before performing MFA-protected actions like transactions.
 * Pass `createMfaTokenOptions: { singleUse: true }` to create a token
 * that's consumed by the next protected operation.
 *
 * @example
 * ```ts
 * await authenticateTotpMfaDevice({
 *   code: "123456",
 *   createMfaTokenOptions: { singleUse: true },
 * });
 * // Now send the transaction...
 * ```
 *
 * @see https://www.dynamic.xyz/docs/javascript/authentication-methods/mfa/action-based
 */
export const authenticateTotpMfaDevice = sdkAuthenticateTotpMfaDevice;

/**
 * Get all registered MFA devices for the current user.
 *
 * Use this to check if the user has MFA set up before prompting for a code.
 * Returns an empty array if no devices are registered.
 */
export async function getMfaDevices() {
  const client = getClient();
  if (!client) return [];

  try {
    return await sdkGetMfaDevices();
  } catch {
    return [];
  }
}

/**
 * Register a new TOTP MFA device for the current user.
 *
 * Returns a URI for generating a QR code and a secret key for manual entry.
 * After registration, the user must verify the device using `authenticateTotpMfaDevice`.
 *
 * @returns { uri: string, secret: string } - URI for QR code and secret for manual entry
 *
 * @see https://dynamic.xyz/docs/javascript/authentication-methods/mfa/totp
 */
export const registerTotpMfaDevice = sdkRegisterTotpMfaDevice;

/**
 * Check if MFA is required for a specific action.
 *
 * Use this to determine if the user needs to complete an MFA challenge
 * before performing sensitive operations.
 *
 * @example
 * ```ts
 * const required = await isMfaRequiredForAction({
 *   mfaAction: MFAAction.WalletWaasSign,
 * });
 * if (required) {
 *   // Prompt for MFA code
 * }
 * ```
 *
 * @see https://www.dynamic.xyz/docs/javascript/authentication-methods/mfa/action-based#your-ui-sdk-implementation
 */
export const isMfaRequiredForAction = sdkIsMfaRequiredForAction;

// Re-export MFAAction enum for use in components
export { MFAAction };

/**
 * MFA Settings from environment configuration
 */
export interface MfaSettings {
  /** Whether session-based MFA is enabled */
  sessionMfaEnabled: boolean;
  /** Whether MFA device setup is required at onboarding */
  mfaRequired: boolean;
  /** Whether any action-based MFA is enabled */
  actionMfaEnabled: boolean;
  /** Whether MFA is enabled at all (session or action) */
  isMfaEnabled: boolean;
}

/**
 * Get MFA settings from the environment configuration.
 *
 * This provides direct access to MFA settings from projectSettings,
 * which is more reliable than checking individual actions.
 *
 * @returns MFA settings or null if client not initialized
 */
export function getMfaSettings(): MfaSettings | null {
  const client = getClient();
  if (!client?.projectSettings) return null;

  const mfaConfig = client.projectSettings.security?.mfa;

  const sessionMfaEnabled = mfaConfig?.enabled ?? false;
  const mfaRequired = mfaConfig?.required ?? false;
  const actionMfaEnabled = mfaConfig?.actions?.some((a) => a.required) ?? false;
  const isMfaEnabled = sessionMfaEnabled || actionMfaEnabled;

  return {
    sessionMfaEnabled,
    mfaRequired,
    actionMfaEnabled,
    isMfaEnabled,
  };
}

/**
 * Get network IDs that have gas sponsorship configured.
 *
 * Checks the ZeroDev provider in projectSettings for `multichainAccountAbstractionProviders`,
 * which contains the list of networks with sponsorship enabled.
 *
 * @returns Array of network IDs with sponsorship, or empty array if not configured
 */
export function getSponsoredNetworkIds(): string[] {
  const client = getClient();
  if (!client?.projectSettings) return [];

  const zerodevProvider = client.projectSettings.providers?.find(
    (p) => p.provider === "zerodev",
  );

  if (!zerodevProvider) return [];

  const sponsoredNetworks =
    zerodevProvider.multichainAccountAbstractionProviders?.map(
      (p) => p.chain,
    ) ?? [];

  return sponsoredNetworks;
}

/**
 * Check if a specific network has gas sponsorship configured.
 *
 * @param networkId - The network ID to check
 * @returns true if sponsorship is configured for this network
 */
export function isNetworkSponsored(networkId: string): boolean {
  const sponsoredNetworks = getSponsoredNetworkIds();
  return sponsoredNetworks.includes(networkId);
}

/**
 * Check if SVM (Solana) gas sponsorship is enabled.
 *
 * When enabled, Dynamic automatically sponsors Solana transaction fees
 * for embedded wallet users. No code changes required - transactions
 * are intercepted and sponsored automatically.
 *
 * @returns true if SVM gas sponsorship is enabled in the dashboard
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/solana/svm-gas-sponsorship
 */
export function isSvmGasSponsorshipEnabled(): boolean {
  const client = getClient();
  if (!client?.projectSettings) return false;

  // Access the SDK settings for embedded wallets
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sdkSettings = (client.projectSettings as any)?.sdk?.embeddedWallets;
  return sdkSettings?.svmGasSponsorshipEnabled ?? false;
}

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
 * @see https://dynamic.xyz/docs/javascript/reference/client/on-event
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
