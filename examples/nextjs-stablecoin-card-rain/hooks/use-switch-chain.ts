import { useState, useEffect, useRef } from "react";
import { useDynamicContext } from "@/lib/dynamic";

export interface UseSwitchChainOptions {
  targetChainId: string | number;
  onSwitchSuccess?: () => void;
  onSwitchError?: (error: Error) => void;
  autoSwitch?: boolean; // Whether to automatically attempt the switch when wallet is ready
}

export function useSwitchChain(options: UseSwitchChainOptions) {
  const {
    targetChainId,
    onSwitchSuccess,
    onSwitchError,
    autoSwitch = true,
  } = options;
  const { primaryWallet, network } = useDynamicContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasSwitched, setHasSwitched] = useState(false);

  // Use ref to ensure we only attempt the switch once
  const hasAttemptedSwitch = useRef(false);
  const targetChainIdString = String(targetChainId);

  const canSwitchNetwork = primaryWallet?.connector.supportsNetworkSwitching();
  const isOnTargetChain = String(network) === targetChainIdString;

  const switchChain = async () => {
    if (!primaryWallet || !canSwitchNetwork) {
      const err = new Error("Wallet does not support network switching");
      setError(err);
      onSwitchError?.(err);
      return false;
    }

    if (isOnTargetChain) {
      setHasSwitched(true);
      onSwitchSuccess?.();
      return true;
    }

    setIsLoading(true);
    setError(null);

    try {
      await primaryWallet.switchNetwork(targetChainId);
      setHasSwitched(true);
      onSwitchSuccess?.();
      return true;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to switch chain");
      setError(error);
      onSwitchError?.(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-switch effect that ensures single execution
  useEffect(() => {
    if (
      autoSwitch &&
      !hasAttemptedSwitch.current &&
      primaryWallet &&
      canSwitchNetwork &&
      !isOnTargetChain &&
      !isLoading &&
      !hasSwitched
    ) {
      hasAttemptedSwitch.current = true;
      switchChain();
    }
  }, [
    primaryWallet,
    canSwitchNetwork,
    isOnTargetChain,
    autoSwitch,
    isLoading,
    hasSwitched,
  ]);

  // Reset attempted switch flag if wallet changes
  useEffect(() => {
    if (primaryWallet) {
      // Reset the flag when wallet changes to allow switching on new wallet
      hasAttemptedSwitch.current = false;
      setHasSwitched(false);
      setError(null);
    }
  }, [primaryWallet?.address]);

  const resetSwitch = () => {
    hasAttemptedSwitch.current = false;
    setHasSwitched(false);
    setError(null);
    setIsLoading(false);
  };

  return {
    switchChain,
    isLoading,
    error,
    hasSwitched,
    isOnTargetChain,
    canSwitchNetwork,
    resetSwitch,
  };
}
