/**
 * Reached right after OTP success (or on cold boot, for an authenticated
 * user with no vault yet) — silently provisions the embedded EVM wallet
 * ("vault") and hands off to Home the moment it exists. Port of the old
 * VaultProvisioning.tsx's auto-trigger-once + describeError logic, now
 * driving ProvisioningView instead of rendering its own markup, and
 * navigating to Home explicitly instead of relying on a parent re-render.
 */
import { NotWaasWalletProviderError } from '@dynamic-labs-sdk/client/waas';
import { NoWalletProviderFoundError } from '@dynamic-labs-sdk/client/core';
import {
  WaasLoadFailedError,
  WaasOnboardingIncompleteError,
} from '@dynamic-labs-sdk/client';
import { useCreateWaasWalletAccounts } from '@dynamic-labs-sdk/react-hooks';
import { useEffect, useRef } from 'react';
import { ProvisioningView } from '../views/ProvisioningView';
import type { RouteProps } from '../navigation';

function describeError(error: Error): string {
  if (error instanceof NoWalletProviderFoundError) {
    return "Embedded wallets aren't enabled for this Dynamic environment yet — enable EVM embedded wallets in the dashboard, then retry.";
  }
  if (error instanceof NotWaasWalletProviderError) {
    return "This Dynamic environment's EVM wallet provider isn't configured for embedded wallets — check the dashboard config, then retry.";
  }
  if (error instanceof WaasOnboardingIncompleteError) {
    return 'Your account needs to finish onboarding (e.g. MFA/recovery setup) before a vault can be created.';
  }
  if (error instanceof WaasLoadFailedError) {
    return 'The embedded-wallet service failed to load — this is usually transient.';
  }
  return error.message;
}

export function ProvisioningRoute({ navigation }: RouteProps<'Provisioning'>) {
  const {
    mutate: createVault,
    isPending,
    isError,
    error,
  } = useCreateWaasWalletAccounts({
    mutateParams: {
      onSuccess: () =>
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
    },
  });

  // Fires exactly once per mount — a ref (not a state flag) so it survives
  // React's dev-mode double-effect without double-firing the mutation, and
  // so Retry (below) doesn't need to reset anything; it calls createVault
  // directly, bypassing this guard.
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      createVault({ chains: ['EVM'] });
    }
  }, [createVault]);

  return (
    <ProvisioningView
      error={isError && error ? describeError(error) : undefined}
      isRetrying={isPending}
      onRetry={() => createVault({ chains: ['EVM'] })}
    />
  );
}
