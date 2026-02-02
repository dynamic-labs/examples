"use client";

/**
 * Reactive Auth State Hook
 *
 * Uses React's useSyncExternalStore to subscribe to Dynamic SDK auth events.
 * This pattern ensures the component re-renders when auth state changes
 * without requiring polling or manual state management.
 *
 * Events subscribed:
 * - userChanged: User profile updated or logged in
 * - walletAccountsChanged: Wallets added/removed
 * - logout: User logged out
 * - initStatusChanged: Client initialization status changed
 *
 * @see https://react.dev/reference/react/useSyncExternalStore
 * @see https://www.dynamic.xyz/docs/javascript/reference/wallets/wallet-provider-events
 */

import { useSyncExternalStore } from "react";
import { isSignedIn, onEvent } from "@/lib/dynamic-client";

/** Events that indicate potential auth state changes */
const AUTH_EVENTS = [
  "userChanged",
  "walletAccountsChanged",
  "logout",
  "initStatusChanged",
] as const;

/**
 * Subscribe to auth-related SDK events
 * Returns cleanup function to unsubscribe
 */
function subscribe(callback: () => void): () => void {
  const unsubscribes = AUTH_EVENTS.map((event) =>
    onEvent({ event, listener: callback }),
  );
  return () => unsubscribes.forEach((unsub) => unsub?.());
}

/**
 * Get current auth state from SDK
 */
function getSnapshot(): boolean {
  return isSignedIn();
}

/**
 * Server-side snapshot - always returns false since auth requires browser
 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Hook to reactively track Dynamic auth state
 *
 * @returns true if user is authenticated, false otherwise
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isLoggedIn = useAuth();
 *   return isLoggedIn ? <Dashboard /> : <LoginScreen />;
 * }
 * ```
 */
export function useAuth(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
