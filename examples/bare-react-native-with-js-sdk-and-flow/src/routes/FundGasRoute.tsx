/**
 * Sends a small, fixed ETH top-up from the just-connected external wallet
 * (route.params, see ConnectWalletRoute.tsx) to the vault, so it can pay for
 * a withdrawal's own gas on Base. Port of the pre-redesign
 * FundVaultGasForm.tsx's mutation, driving FundGasView instead of its own
 * markup.
 *
 * On success, hands the connected wallet back to WithdrawRoute via
 * `navigation.popTo` (not `navigate` or `goBack`) — this is how WithdrawRoute
 * learns a wallet is available to reuse as the withdrawal destination
 * without forcing a second connect. `popTo(name, params, {merge: true})` is
 * React Navigation v7's dedicated API for "pop back to an existing screen
 * further down the stack and merge in new params" — confirmed against
 * @react-navigation/routers' actual StackRouter source, not assumed: a plain
 * `navigate('Withdraw', ...)` here does NOT pop back to the existing
 * Withdraw instance (that implicit v6 behavior was replaced by `popTo` in
 * v7); it pushes a second, independent Withdraw screen, stranding this
 * already-used FundGas screen (and the first, now-stale Withdraw instance)
 * permanently in the back-stack. Caught by adversarial review before this
 * ever shipped, not discovered live — MetaMask/WalletConnect can't be
 * installed on the iOS Simulator to exercise this path end-to-end here.
 */
import {
  confirmTransaction,
  getActiveNetworkId,
  isProgrammaticNetworkSwitchAvailable,
  switchActiveNetwork,
  transferAmount,
} from '@dynamic-labs-sdk/client';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { formatEther, parseEther } from 'viem';
import { FundGasView } from '../views/FundGasView';
import { config } from '../consts/config';
import {
  EXTERNAL_WALLET_GAS_BUFFER_ETH,
  VAULT_GAS_TOPUP_ETH,
} from '../consts/flow';
import { getNativeBalance } from '../utils/getNativeBalance';
import type { RouteProps } from '../navigation';

export function FundGasRoute({ navigation, route }: RouteProps<'FundGas'>) {
  const { vaultAddress, externalAccount } = route.params;
  const [stepLabel, setStepLabel] = useState<string | null>(null);

  const {
    mutate: fundGas,
    isPending,
    error,
  } = useMutation({
    mutationFn: async () => {
      setStepLabel('Checking your wallet…');

      // Preflight: transferAmount below would otherwise fail inside the
      // wallet provider with a raw "insufficient funds" message that gives
      // no hint it's the *external* wallet (not the vault) that's short.
      const externalBalance = await getNativeBalance(externalAccount.address);
      const requiredExternalBalance =
        parseEther(VAULT_GAS_TOPUP_ETH) +
        parseEther(EXTERNAL_WALLET_GAS_BUFFER_ETH);
      if (externalBalance < requiredExternalBalance) {
        throw new Error(
          `Your connected wallet needs at least ${formatEther(
            requiredExternalBalance,
          )} ETH on Base (for the top-up plus its own gas) to fund your vault.`,
        );
      }

      const { networkId: activeNetworkId } = await getActiveNetworkId({
        walletAccount: externalAccount,
      });

      // transferAmount/confirmTransaction have no networkId param at all —
      // they resolve chain from whatever network the external wallet is
      // currently "active" on. Must switch it to Base first if it isn't
      // already, or this ETH send could land on (and be paid from) the
      // wrong chain entirely.
      if (activeNetworkId !== config.chainId) {
        const canSwitch = isProgrammaticNetworkSwitchAvailable({
          walletAccount: externalAccount,
        });
        if (!canSwitch) {
          throw new Error(
            'Your connected wallet is on a different network and can’t be switched automatically. Switch it to Base mainnet yourself, then tap "Send ETH to vault" again.',
          );
        }

        setStepLabel('Switching your wallet to Base…');
        await switchActiveNetwork({
          networkId: config.chainId,
          walletAccount: externalAccount,
        });

        const { networkId: verifiedNetworkId } = await getActiveNetworkId({
          walletAccount: externalAccount,
        });
        if (verifiedNetworkId !== config.chainId) {
          throw new Error(
            "Couldn't confirm your wallet switched to Base mainnet. Switch it manually and try again.",
          );
        }
      }

      setStepLabel('Check your wallet to approve sending ETH…');

      const { transactionHash } = await transferAmount({
        walletAccount: externalAccount,
        amount: VAULT_GAS_TOPUP_ETH,
        recipient: vaultAddress,
      });

      setStepLabel('Confirming…');

      await confirmTransaction({
        walletAccount: externalAccount,
        transactionHash,
      });

      navigation.popTo(
        'Withdraw',
        { reusableExternalAccount: externalAccount },
        { merge: true },
      );
    },
    onError: () => setStepLabel(null),
  });

  return (
    <FundGasView
      topupAmountEth={VAULT_GAS_TOPUP_ETH}
      onFund={() => fundGas()}
      isPending={isPending}
      stepLabel={stepLabel ?? undefined}
      error={error?.message}
      onBack={() => navigation.goBack()}
    />
  );
}
