"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { OTPVerification, NetworkData } from "@/lib/dynamic-client";

// =============================================================================
// SCREEN TYPES (Single Source of Truth)
// =============================================================================

export type Screen =
  | { type: "auth" }
  | { type: "otp-verify"; email: string; otpVerification: OTPVerification }
  | { type: "dashboard" }
  | { type: "send-tx"; walletAddress: string; chain: string }
  | { type: "tx-result"; txHash: string; networkData: NetworkData };

// =============================================================================
// NAVIGATION HOOK
// =============================================================================

export interface NavigationReturn {
  screen: Screen;
  /** True when screen state is consistent with auth state */
  isReady: boolean;
  isTransitioning: boolean;
  goToAuth: () => void;
  goToOtpVerify: (email: string, otpVerification: OTPVerification) => void;
  goToDashboard: () => void;
  goToSendTx: (walletAddress: string, chain: string) => void;
  goToTxResult: (txHash: string, networkData: NetworkData) => void;
}

const TRANSITION_DURATION = 150;

/**
 * Screen navigation state machine with auth-reactive redirects
 *
 * Initializes screen based on auth state to prevent flash of wrong screen.
 */
export function useNavigation(isLoggedIn: boolean): NavigationReturn {
  // Initialize screen based on current auth state to prevent flash
  const [screen, setScreen] = useState<Screen>(() =>
    isLoggedIn ? { type: "dashboard" } : { type: "auth" },
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Track previous isLoggedIn to detect changes (not initial state)
  const prevIsLoggedIn = useRef(isLoggedIn);

  // Transition helper with animation
  const transitionTo = useCallback((newScreen: Screen) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setScreen(newScreen);
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, []);

  // Auto-redirect based on auth state changes
  useEffect(() => {
    // Only react to auth state changes, not initial state
    const authChanged = prevIsLoggedIn.current !== isLoggedIn;
    prevIsLoggedIn.current = isLoggedIn;

    // When logged in and on auth/otp-verify screen, go to dashboard
    if (
      isLoggedIn &&
      (screen.type === "auth" || screen.type === "otp-verify")
    ) {
      // Always redirect if logged in on auth screens (handles both initial and changes)
      if (authChanged || screen.type === "otp-verify") {
        transitionTo({ type: "dashboard" });
      }
    }
    // When logged out and on protected screen, go to auth
    if (!isLoggedIn && screen.type !== "auth" && screen.type !== "otp-verify") {
      transitionTo({ type: "auth" });
    }
  }, [isLoggedIn, screen.type, transitionTo]);

  // Memoized navigation functions
  const goToAuth = useCallback(() => {
    transitionTo({ type: "auth" });
  }, [transitionTo]);

  const goToOtpVerify = useCallback(
    (email: string, otpVerification: OTPVerification) => {
      transitionTo({ type: "otp-verify", email, otpVerification });
    },
    [transitionTo],
  );

  const goToDashboard = useCallback(() => {
    transitionTo({ type: "dashboard" });
  }, [transitionTo]);

  const goToSendTx = useCallback(
    (walletAddress: string, chain: string) => {
      transitionTo({ type: "send-tx", walletAddress, chain });
    },
    [transitionTo],
  );

  const goToTxResult = useCallback(
    (txHash: string, networkData: NetworkData) => {
      transitionTo({ type: "tx-result", txHash, networkData });
    },
    [transitionTo],
  );

  // Screen is ready when it matches expected state for auth
  // - Logged in: should NOT be on auth/otp-verify screens
  // - Logged out: should be on auth or otp-verify screens
  const isAuthScreen = screen.type === "auth" || screen.type === "otp-verify";
  const isReady = isLoggedIn ? !isAuthScreen : isAuthScreen;

  return {
    screen,
    isReady,
    isTransitioning,
    goToAuth,
    goToOtpVerify,
    goToDashboard,
    goToSendTx,
    goToTxResult,
  };
}
