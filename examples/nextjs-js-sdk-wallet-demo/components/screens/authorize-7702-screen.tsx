"use client";

/**
 * EIP-7702 Authorization Screen
 *
 * Prompts the user to sign EIP-7702 authorization for smart account features.
 * This ONLY signs the authorization - no transaction is sent.
 * The signed auth is stored in memory and used when sending the first transaction.
 *
 * MFA Flow:
 * - Uses singleUse: true (only 1 signature needed)
 * - If MFA is required but no device is registered, redirects to setup
 * - If MFA is required and device exists, prompts for code
 */

import { useState } from "react";
import { Shield, ArrowLeft, Zap, Sparkles } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";
import { Button } from "@/components/ui/button";
import { LoadingCard } from "@/components/ui/loading-card";
import { ErrorCard } from "@/components/ui/error-card";
import { MfaCodeInput } from "@/components/ui/mfa-code-input";
import { ErrorMessage } from "@/components/error-message";
import { NetworkSelectorSection } from "@/components/wallet/network-selector-section";
import { useSign7702 } from "@/hooks/use-mutations";
import { use7702Authorization } from "@/hooks/use-7702-authorization";
import { useWalletAccounts } from "@/hooks/use-wallet-accounts";
import { useActiveNetwork } from "@/hooks/use-active-network";
import { useMfaStatus, isMfaRequiredError } from "@/hooks/use-mfa-status";
import {
  isEvmWalletAccount,
  isNetworkSponsored,
  type EvmWalletAccount,
} from "@/lib/dynamic";
import { truncateAddress } from "@/lib/utils";
import type { SignAuthorizationReturnType } from "@/lib/transactions/sign-7702-authorization";

interface Authorize7702ScreenProps {
  walletAddress: string;
  /** Called with the signed authorization when signing succeeds */
  onSuccess: (signedAuth: SignAuthorizationReturnType) => void;
  onCancel: () => void;
  /** Called when MFA is required but no device is registered */
  onNeedsMfaSetup: () => void;
  /** Whether this screen was reached from MFA setup - shows hint to wait for new code */
  fromMfaSetup?: boolean;
}

/**
 * Authorization screen for enabling smart account features via EIP-7702
 */
export function Authorize7702Screen({
  walletAddress,
  onSuccess,
  onCancel,
  onNeedsMfaSetup,
  fromMfaSetup = false,
}: Authorize7702ScreenProps) {
  const [mfaCode, setMfaCode] = useState("");
  const { walletAccounts } = useWalletAccounts();
  const sign = useSign7702();
  const {
    isMfaEnabled,
    hasDevice,
    needsSetup,
    isLoading: mfaLoading,
  } = useMfaStatus();

  // Find the ZeroDev wallet for this address
  const zerodevWallet = walletAccounts.find(
    (w) =>
      w.address.toLowerCase() === walletAddress.toLowerCase() &&
      w.walletProviderKey.includes("zerodev") &&
      isEvmWalletAccount(w),
  ) as EvmWalletAccount | undefined;

  const { networkData, refetch: refetchNetwork } = useActiveNetwork(
    zerodevWallet ?? null,
  );

  // Check if already authorized on current network
  const {
    isAuthorized,
    isLoading: authLoading,
    invalidate: invalidateAuth,
  } = use7702Authorization(zerodevWallet?.address, networkData);

  // Check if sponsorship is available on current network
  const isSponsored = networkData?.networkId
    ? isNetworkSponsored(networkData.networkId)
    : false;

  // Handle network change - refresh authorization status
  const handleNetworkChange = () => {
    refetchNetwork();
    invalidateAuth();
    setMfaCode(""); // Clear MFA code when switching networks
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zerodevWallet || !networkData) return;

    // If MFA is enabled and user has device, require code
    const requiresMfaCode = isMfaEnabled && hasDevice;
    if (requiresMfaCode && !mfaCode.trim()) return;

    try {
      // Sign the authorization and pass it to parent
      const signedAuth = await sign.mutateAsync({
        walletAccount: zerodevWallet,
        networkData,
        mfaCode: requiresMfaCode ? mfaCode : undefined,
      });
      onSuccess(signedAuth);
    } catch (error) {
      // Only redirect to MFA setup if error specifically indicates setup is needed
      // (not for auth failures like wrong code or expired token)
      if (isMfaRequiredError(error)) {
        onNeedsMfaSetup();
        return;
      }

      // Clear the MFA code on auth failure so user can try again
      setMfaCode("");

      // Other errors are handled by mutation error state
    }
  };

  const shieldIcon = (
    <Shield
      className="w-[18px] h-[18px] text-(--widget-accent)"
      strokeWidth={1.5}
    />
  );

  // Loading state while checking MFA status
  if (mfaLoading) {
    return (
      <LoadingCard
        icon={shieldIcon}
        title="Enable Smart Account"
        onClose={onCancel}
      />
    );
  }

  // MFA setup required - show prompt to set up MFA
  if (needsSetup) {
    return (
      <WidgetCard
        icon={shieldIcon}
        title="MFA Setup Required"
        onClose={onCancel}
      >
        <div className="space-y-4">
          <p className="text-sm text-(--widget-muted)">
            You need to set up an authenticator app before enabling your smart
            account.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onCancel} className="flex-1">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={onNeedsMfaSetup} className="flex-1">
              Set Up MFA
            </Button>
          </div>
        </div>
      </WidgetCard>
    );
  }

  // Error state if wallet not found
  if (!zerodevWallet) {
    return (
      <ErrorCard
        icon={
          <Shield
            className="w-[18px] h-[18px] text-(--widget-error)"
            strokeWidth={1.5}
          />
        }
        message="Smart wallet not found for this address. Please ensure you have a ZeroDev wallet configured."
        onClose={onCancel}
      />
    );
  }

  // Still loading authorization status
  if (authLoading) {
    return (
      <LoadingCard
        icon={shieldIcon}
        title="Enable Smart Account"
        subtitle={`For ${truncateAddress(walletAddress)}`}
        onClose={onCancel}
      />
    );
  }

  return (
    <WidgetCard
      icon={shieldIcon}
      title="Enable Smart Account"
      subtitle={`For ${truncateAddress(walletAddress)}`}
      onClose={onCancel}
    >
      <div className="space-y-4">
        {/* Network Selector */}
        {zerodevWallet && (
          <NetworkSelectorSection
            walletAccount={zerodevWallet}
            onNetworkChange={handleNetworkChange}
            sponsorship={
              isSponsored
                ? { type: "available", message: "Sponsorship available" }
                : { type: "unavailable", message: "No sponsorship" }
            }
          />
        )}

        {/* Network doesn't support sponsorship */}
        {!isSponsored && (
          <div className="p-3 bg-(--widget-row-bg) rounded-(--widget-radius)">
            <p className="text-sm text-(--widget-muted)">
              Gas sponsorship is not available on{" "}
              <span className="font-medium text-(--widget-fg)">
                {networkData?.displayName ?? "this network"}
              </span>
              . Select a supported network above.
            </p>
          </div>
        )}

        {/* Already authorized on-chain */}
        {isSponsored && isAuthorized && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-(--widget-radius)">
            <p className="text-sm text-green-600 dark:text-green-400">
              Smart account is already enabled on{" "}
              <span className="font-medium">
                {networkData?.displayName ?? "this network"}
              </span>
              . You can send gasless transactions.
            </p>
          </div>
        )}

        {/* Needs authorization */}
        {isSponsored && !isAuthorized && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feature highlights */}
            <div className="space-y-2">
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-(--widget-accent)/5 rounded-(--widget-radius)">
                  <Zap className="w-4 h-4 text-(--widget-accent)" />
                  <span className="text-xs font-medium text-(--widget-fg)">
                    Gas-free transactions
                  </span>
                </div>
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-(--widget-accent)/5 rounded-(--widget-radius)">
                  <Sparkles className="w-4 h-4 text-(--widget-accent)" />
                  <span className="text-xs font-medium text-(--widget-fg)">
                    Smart account
                  </span>
                </div>
              </div>
              <p className="text-xs text-(--widget-muted) text-center">
                One-time setup for{" "}
                <span className="font-medium text-(--widget-fg)">
                  {networkData?.displayName ?? "this network"}
                </span>
              </p>
            </div>

            {isMfaEnabled && hasDevice ? (
              <div className="space-y-2">
                {fromMfaSetup && (
                  <p className="text-xs text-(--widget-muted) text-center">
                    Wait for a new code from your authenticator app before
                    continuing.
                  </p>
                )}
                <MfaCodeInput
                  value={mfaCode}
                  onChange={setMfaCode}
                  disabled={sign.isPending}
                  autoFocus
                />
              </div>
            ) : !isMfaEnabled ? (
              <p className="text-xs text-(--widget-muted)">
                MFA not enabled for this environment.
              </p>
            ) : null}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={sign.isPending}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={sign.isPending}
                disabled={isMfaEnabled && hasDevice && mfaCode.length !== 6}
              >
                {sign.isPending ? "Signing..." : "Sign Authorization"}
              </Button>
            </div>

            <ErrorMessage error={sign.error} />
          </form>
        )}

        {/* Back button when no action needed */}
        {(!isSponsored || isAuthorized) && (
          <Button variant="secondary" className="w-full" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
      </div>
    </WidgetCard>
  );
}
