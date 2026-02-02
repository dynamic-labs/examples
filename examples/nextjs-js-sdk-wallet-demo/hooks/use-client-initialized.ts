"use client";

import { useSyncExternalStore } from "react";
import { getInitStatus, onEvent, type InitStatus } from "@/lib/dynamic-client";

/**
 * Subscribe to initialization status changes
 */
function subscribe(callback: () => void) {
  try {
    const unsub = onEvent({ event: "initStatusChanged", listener: callback });
    return () => unsub?.();
  } catch {
    return () => {};
  }
}

/**
 * Get current initialization status
 */
function getSnapshot(): InitStatus {
  try {
    return getInitStatus();
  } catch {
    return "uninitialized";
  }
}

/**
 * Server snapshot - always uninitialized
 */
function getServerSnapshot(): InitStatus {
  return "uninitialized";
}

/**
 * Hook to reactively track Dynamic client initialization status
 * Returns true when client is ready (finished or failed)
 */
export function useClientInitialized(): boolean {
  const status = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  // Consider initialized when finished OR failed (so UI can show error)
  return status === "finished" || status === "failed";
}
