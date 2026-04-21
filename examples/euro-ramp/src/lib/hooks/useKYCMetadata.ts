"use client";

import {
  useDynamicContext,
  useUserUpdateRequest,
} from "@dynamic-labs/sdk-react-core";
import { useState, useEffect, useCallback, useRef } from "react";

// =============================================================================
// TYPES
// =============================================================================

export type OnboardStep =
  | "customer"
  | "kyc"
  | "signings"
  | "wallet"
  | "bank"
  | "complete";

export interface IronKYCMetadata {
  iron?: {
    customerId?: string;
    walletId?: string;
    walletAddress?: string;
    bankAccountId?: string;
    bankIban?: string;
    identificationId?: string;
    kycUrl?: string;
    onboardingStep?: OnboardStep;
    kycCompleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface KYCState {
  customerId: string;
  walletId: string;
  walletAddress: string;
  bankAccountId: string;
  bankIban: string; // The actual IBAN for the bank account
  identificationId: string;
  kycUrl: string;
  step: OnboardStep;
  kycCompleted: boolean;
}

const DEFAULT_STATE: KYCState = {
  customerId: "",
  walletId: "",
  walletAddress: "",
  bankAccountId: "",
  bankIban: "",
  identificationId: "",
  kycUrl: "",
  step: "customer",
  kycCompleted: false,
};

// =============================================================================
// HOOK
// =============================================================================

/**
 * useKYCMetadata - Manages KYC onboarding state in Dynamic user metadata
 *
 * Single source of truth: user.metadata.iron. All state is stored there and
 * synced via updateUser(); re-run init when user/metadata changes to stay in sync.
 */
export function useKYCMetadata() {
  const { user } = useDynamicContext();
  const { updateUser } = useUserUpdateRequest();

  const [state, setState] = useState<KYCState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSyncedState = useRef<string>("");

  // ---------------------------------------------------------------------------
  // Load state from Dynamic user metadata
  // ---------------------------------------------------------------------------
  const loadFromDynamic = useCallback((): KYCState | null => {
    if (!user?.metadata) return null;

    const metadata = user.metadata as IronKYCMetadata;
    if (!metadata.iron) return null;

    return {
      customerId: metadata.iron.customerId || "",
      walletId: metadata.iron.walletId || "",
      walletAddress: metadata.iron.walletAddress || "",
      bankAccountId: metadata.iron.bankAccountId || "",
      bankIban: metadata.iron.bankIban || "",
      identificationId: metadata.iron.identificationId || "",
      kycUrl: metadata.iron.kycUrl || "",
      step: metadata.iron.onboardingStep || "customer",
      kycCompleted: metadata.iron.kycCompleted || false,
    };
  }, [user?.metadata]);

  // ---------------------------------------------------------------------------
  // Sync state to Dynamic user metadata
  // ---------------------------------------------------------------------------
  const syncToDynamic = useCallback(
    async (newState: KYCState): Promise<boolean> => {
      if (!user) {
        console.warn("[useKYCMetadata] No user, skipping Dynamic sync");
        return false;
      }

      // Avoid unnecessary syncs
      const stateHash = JSON.stringify(newState);
      if (stateHash === lastSyncedState.current) {
        return true;
      }

      setIsSyncing(true);
      setError(null);

      try {
        const metadata: IronKYCMetadata = {
          ...(user.metadata as IronKYCMetadata),
          iron: {
            customerId: newState.customerId,
            walletId: newState.walletId,
            walletAddress: newState.walletAddress,
            bankAccountId: newState.bankAccountId,
            bankIban: newState.bankIban,
            identificationId: newState.identificationId,
            kycUrl: newState.kycUrl,
            onboardingStep: newState.step,
            kycCompleted: newState.kycCompleted,
            updatedAt: new Date().toISOString(),
            // Preserve createdAt if it exists
            createdAt:
              (user.metadata as IronKYCMetadata)?.iron?.createdAt ||
              new Date().toISOString(),
          },
        };

        await updateUser({ metadata });
        lastSyncedState.current = stateHash;
        console.log("[useKYCMetadata] Synced to Dynamic:", metadata.iron);
        return true;
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : "Failed to sync to Dynamic";
        console.error("[useKYCMetadata] Sync failed:", errorMessage);
        setError(errorMessage);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [user, updateUser]
  );

  // ---------------------------------------------------------------------------
  // Initialize state from Dynamic user metadata (re-run when user/metadata changes)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setIsLoading(true);

    const dynamicState = loadFromDynamic();

    if (dynamicState && dynamicState.customerId) {
      setState(dynamicState);
      lastSyncedState.current = JSON.stringify(dynamicState);
    } else {
      setState(DEFAULT_STATE);
    }

    setIsLoading(false);
  }, [user?.userId, user?.metadata, loadFromDynamic]);

  // ---------------------------------------------------------------------------
  // Update state and sync to Dynamic user metadata
  // ---------------------------------------------------------------------------
  const updateState = useCallback(
    async (updates: Partial<KYCState>): Promise<boolean> => {
      const newState = { ...state, ...updates };
      setState(newState);

      if (user) {
        return await syncToDynamic(newState);
      }

      return true;
    },
    [state, user, syncToDynamic]
  );

  // ---------------------------------------------------------------------------
  // Convenience methods for updating individual fields
  // ---------------------------------------------------------------------------
  const setCustomerId = useCallback(
    (customerId: string) => updateState({ customerId }),
    [updateState]
  );

  const setWalletId = useCallback(
    (walletId: string) => updateState({ walletId }),
    [updateState]
  );

  const setBankAccountId = useCallback(
    (bankAccountId: string) => updateState({ bankAccountId }),
    [updateState]
  );

  const setIdentificationId = useCallback(
    (identificationId: string) => updateState({ identificationId }),
    [updateState]
  );

  const setKycUrl = useCallback(
    (kycUrl: string) => updateState({ kycUrl }),
    [updateState]
  );

  const setStep = useCallback(
    (step: OnboardStep) => updateState({ step }),
    [updateState]
  );

  const setKycCompleted = useCallback(
    (kycCompleted: boolean) => updateState({ kycCompleted }),
    [updateState]
  );

  // ---------------------------------------------------------------------------
  // Reset all state
  // ---------------------------------------------------------------------------
  const reset = useCallback(async (): Promise<boolean> => {
    setState(DEFAULT_STATE);
    lastSyncedState.current = "";

    if (user) {
      return await syncToDynamic(DEFAULT_STATE);
    }

    return true;
  }, [user, syncToDynamic]);

  // ---------------------------------------------------------------------------
  // Force sync to Dynamic (useful after completing a major step)
  // ---------------------------------------------------------------------------
  const forceSync = useCallback(async (): Promise<boolean> => {
    if (!user) {
      console.warn("[useKYCMetadata] No user, cannot force sync");
      return false;
    }

    lastSyncedState.current = ""; // Clear cache to force sync
    return await syncToDynamic(state);
  }, [user, state, syncToDynamic]);

  return {
    // State
    ...state,
    isLoading,
    isSyncing,
    error,

    // Update methods
    updateState,
    setCustomerId,
    setWalletId,
    setBankAccountId,
    setIdentificationId,
    setKycUrl,
    setStep,
    setKycCompleted,

    // Utility methods
    reset,
    forceSync,
  };
}
