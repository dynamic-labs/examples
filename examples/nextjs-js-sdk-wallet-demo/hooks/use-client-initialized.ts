"use client";

/**
 * Client Initialization Hook
 *
 * Tracks Dynamic SDK initialization status using module-level state.
 * Module-level state is necessary because the SDK starts initializing
 * immediately when imported, and events may fire before components mount.
 *
 * Uses both event subscription and promise-based wait to handle the race
 * condition where initialization completes before subscription is set up.
 */

import { useSyncExternalStore } from "react";
import {
  getInitStatus,
  onEvent,
  waitForClientInitialized,
  type InitStatus,
} from "@/lib/dynamic";

let cachedStatus: InitStatus = "uninitialized";
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function updateStatus(newStatus: InitStatus) {
  if (cachedStatus !== newStatus) {
    cachedStatus = newStatus;
    notifyListeners();
  }
}

// Eagerly initialize on module load (client-side only)
if (typeof window !== "undefined") {
  try {
    cachedStatus = getInitStatus();
  } catch {
    cachedStatus = "uninitialized";
  }

  try {
    onEvent({
      event: "initStatusChanged",
      listener: () => updateStatus(getInitStatus()),
    });
  } catch {
    // Subscription failed - rely on promise fallback
  }

  waitForClientInitialized()
    .then(() => updateStatus(getInitStatus()))
    .catch(() => updateStatus("failed"));
}

/** Subscribe to status changes */
function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Get current cached status */
function getSnapshot(): InitStatus {
  return cachedStatus;
}

/** Server snapshot - always uninitialized */
function getServerSnapshot(): InitStatus {
  return "uninitialized";
}

/**
 * Hook to reactively track Dynamic client initialization status
 *
 * @returns true when client is ready (finished or failed)
 */
export function useClientInitialized(): boolean {
  const status = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return status === "finished" || status === "failed";
}
