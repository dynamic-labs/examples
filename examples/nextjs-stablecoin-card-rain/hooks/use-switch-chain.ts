import { useState, useEffect, useRef } from "react";
import { useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";

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
  const { walletAccounts } = useWalletAccounts();
  const evmWallet = walletAccounts?.find(isEvmWalletAccount);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasSwitched, setHasSwitched] = useState(false);

  // Use ref to ensure we only attempt the switch once
  const hasAttemptedSwitch = useRef(false);
  const targetChainIdString = String(targetChainId);

  // Embedded WaaS wallets manage their network via dashboard configuration;
  // network switching is not supported directly via the client SDK.
  const canSwitchNetwork = false;
  const currentChainId = evmWallet?.network?.id ? String(evmWallet.network.id) : undefined;
  const isOnTargetChain = currentChainId === targetChainIdString;

  const switchChain = async () => {
    if (isOnTargetChain) {
      setHasSwitched(true);
      onSwitchSuccess?.();
      return true;
    }

    const err = new Error("Network switching is managed via the Dynamic dashboard for embedded wallets");
    setError(err);
    onSwitchError?.(err);
    return false;
  };

  // Auto-switch effect that ensures single execution
  useEffect(() => {
    if (
      autoSwitch &&
      !hasAttemptedSwitch.current &&
      evmWallet &&
      !isOnTargetChain &&
      !isLoading &&
      !hasSwitched
    ) {
      hasAttemptedSwitch.current = true;
      switchChain();
    }
  }, [
    evmWallet,
    isOnTargetChain,
    autoSwitch,
    isLoading,
    hasSwitched,
  ]);

  // Reset attempted switch flag if wallet changes
  useEffect(() => {
    if (evmWallet) {
      // Reset the flag when wallet changes to allow switching on new wallet
      hasAttemptedSwitch.current = false;
      setHasSwitched(false);
      setError(null);
    }
  }, [evmWallet?.address]);

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
