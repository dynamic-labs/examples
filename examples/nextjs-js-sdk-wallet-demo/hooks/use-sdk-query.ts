"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { onEvent } from "@/lib/dynamic-client";

type DynamicEvent =
  | "userChanged"
  | "walletAccountsChanged"
  | "logout"
  | "initStatusChanged"
  | "walletProviderChanged"
  | "tokenChanged";

interface UseSdkQueryOptions<T> {
  queryKey: unknown[];
  queryFn: () => Promise<T> | T;
  refetchEvent?: DynamicEvent;
  eventFilter?: (payload: unknown) => boolean;
  enabled?: boolean;
}

/**
 * Generic factory for SDK data hooks
 * DRY pattern - all data hooks use this base
 */
export function useSdkQuery<T>({
  queryKey,
  queryFn,
  refetchEvent,
  eventFilter,
  enabled = true,
}: UseSdkQueryOptions<T>) {
  const { data, refetch, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    enabled,
  });

  // Subscribe to refetch events
  useEffect(() => {
    if (!refetchEvent) return;

    const unsubscribe = onEvent({
      event: refetchEvent,
      listener: (payload: unknown) => {
        if (!eventFilter || eventFilter(payload)) {
          void refetch();
        }
      },
    });

    return unsubscribe;
  }, [refetchEvent, eventFilter, refetch]);

  return { data, refetch, isLoading, error };
}
