"use client";

/**
 * MFA Status Hook
 *
 * Centralized hook to determine MFA state for the current user:
 * - isMfaEnabled: Whether MFA is enabled in the environment
 * - isRequired: Whether MFA device setup is required at onboarding
 * - hasDevice: Whether the user has registered an MFA device
 * - needsSetup: Whether the user needs to set up MFA (required but no device)
 *
 * This hook checks the environment configuration via `getMfaSettings`
 * and the user's device status via `getMfaDevices`.
 */

import { useQuery } from "@tanstack/react-query";
import { getMfaDevices, getMfaSettings } from "@/lib/dynamic";

export interface UseMfaStatusResult {
  /** Whether MFA is enabled in the environment (session or action-based) */
  isMfaEnabled: boolean;
  /** Whether MFA device setup is required at onboarding */
  isRequired: boolean;
  /** Whether the user has at least one MFA device registered */
  hasDevice: boolean;
  /** Whether user needs to set up MFA (enabled and required but no device) */
  needsSetup: boolean;
  /** Whether MFA will be required for transactions (enabled and device is set up) */
  requiresMfa: boolean;
  /** Whether the status check is in progress */
  isLoading: boolean;
  /** Error if the check failed */
  error: Error | null;
  /** Refetch the MFA status */
  refetch: () => void;
}

/**
 * Check MFA requirement and device status for the current user
 *
 * @returns MFA status including whether setup is needed
 */
export function useMfaStatus(): UseMfaStatusResult {
  const query = useQuery({
    queryKey: ["mfa-status"],
    queryFn: async () => {
      // Get MFA settings from environment configuration
      const settings = getMfaSettings();
      const isMfaEnabled = settings?.isMfaEnabled ?? false;
      const mfaRequired = settings?.mfaRequired ?? false;

      // Check if user has any MFA devices registered
      let hasDevice = false;
      try {
        const devices = await getMfaDevices();
        hasDevice = devices.length > 0;
      } catch {
        hasDevice = false;
      }

      // User needs setup if MFA is enabled (session OR action-based) AND no device exists
      // This catches both onboarding-required MFA and action-based MFA
      const needsSetup = isMfaEnabled && !hasDevice;

      // MFA will be required for transactions if enabled and device is set up
      const requiresMfa = isMfaEnabled && hasDevice;

      return { isMfaEnabled, isRequired: mfaRequired, hasDevice, needsSetup, requiresMfa };
    },
    staleTime: 60_000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    isMfaEnabled: query.data?.isMfaEnabled ?? false,
    isRequired: query.data?.isRequired ?? false,
    hasDevice: query.data?.hasDevice ?? false,
    needsSetup: query.data?.needsSetup ?? false,
    requiresMfa: query.data?.requiresMfa ?? false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Check if an error is MFA-related.
 *
 * Note: This is intentionally simple. For determining if MFA setup is needed,
 * use the `needsSetup` value from `useMfaStatus()` which proactively checks
 * device status rather than relying on error message parsing.
 *
 * @deprecated Prefer proactive checking via useMfaStatus().needsSetup
 */
export function isMfaRequiredError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  // Only check for generic MFA-related errors
  // The proactive needsSetup check should handle setup requirements
  return (
    errorMessage.includes("mfa") && errorMessage.includes("device required")
  );
}
