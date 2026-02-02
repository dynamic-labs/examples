"use client";

/**
 * React Query Mutations for Dynamic SDK Operations
 *
 * This file centralizes all mutations (write operations) using TanStack Query.
 * Benefits:
 * - Automatic loading/error states via isPending, error
 * - Cache invalidation on success
 * - Consistent error handling patterns
 *
 * @see https://tanstack.com/query/latest/docs/react/guides/mutations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createWaasWalletAccounts,
  sendEmailOTP,
  verifyOTP,
  authenticateWithSocial,
  logout,
  type OTPVerification,
  type Chain,
} from "@/lib/dynamic-client";
import {
  sendTransaction,
  type SendTransactionParams,
} from "@/lib/transactions/send-transaction";

// =============================================================================
// AUTH MUTATIONS
// =============================================================================

/**
 * Send OTP to user's email for passwordless authentication
 *
 * @returns OTPVerification object needed to verify the code
 *
 * @example
 * ```tsx
 * const sendOTP = useSendEmailOTP();
 * const otpVerification = await sendOTP.mutateAsync("user@example.com");
 * ```
 */
export function useSendEmailOTP() {
  return useMutation({
    mutationFn: (email: string) => sendEmailOTP({ email }),
  });
}

/**
 * Verify the OTP code entered by the user
 * Completes the email authentication flow
 *
 * @example
 * ```tsx
 * const verifyOTP = useVerifyOTP();
 * await verifyOTP.mutateAsync({ otpVerification, otp: "123456" });
 * ```
 */
export function useVerifyOTP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      otpVerification,
      otp,
    }: {
      otpVerification: OTPVerification;
      otp: string;
    }) =>
      verifyOTP({
        otpVerification,
        verificationToken: otp,
      }),
    onSuccess: () => {
      // Refresh wallet accounts after successful login
      queryClient.invalidateQueries({ queryKey: ["walletAccounts"] });
    },
  });
}

/**
 * Initiate Google OAuth flow
 * Redirects user to Google, then back to the app
 *
 * Note: OAuth completion is handled in AuthScreen via detectOAuthRedirect
 */
export function useGoogleAuth() {
  return useMutation({
    mutationFn: () =>
      authenticateWithSocial({
        provider: "google",
        redirectUrl: window.location.href,
      }),
  });
}

/**
 * Log out the current user
 * Clears all cached queries on success
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// =============================================================================
// WALLET MUTATIONS
// =============================================================================

/**
 * Create a new embedded wallet (WaaS) for the authenticated user
 *
 * @param chain - Chain type from Dynamic SDK (e.g., "EVM", "SOL")
 *
 * Note: WaaS wallets are permanently tied to the user's account
 * and cannot be deleted.
 *
 * @example
 * ```tsx
 * const createWallet = useCreateWallet();
 * await createWallet.mutateAsync("EVM");
 * ```
 */
export function useCreateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chain: Chain) => createWaasWalletAccounts({ chains: [chain] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletAccounts"] });
    },
  });
}

// =============================================================================
// TRANSACTION MUTATIONS
// =============================================================================

/**
 * Send a transaction from an embedded wallet
 *
 * Automatically handles:
 * - Chain detection (EVM vs Solana)
 * - ZeroDev gas sponsorship for EVM (with fallback)
 * - Transaction signing and broadcasting
 *
 * @returns Transaction hash on success
 *
 * @example
 * ```tsx
 * const sendTx = useSendTransaction();
 * const txHash = await sendTx.mutateAsync({
 *   walletAccount,
 *   amount: "0.001",
 *   recipient: "0x...",
 *   networkData,
 *   allWalletAccounts,
 * });
 * ```
 */
export function useSendTransaction() {
  return useMutation({
    mutationFn: (params: SendTransactionParams) => sendTransaction(params),
  });
}
