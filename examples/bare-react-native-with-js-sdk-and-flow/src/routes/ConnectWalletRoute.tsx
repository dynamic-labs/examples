/**
 * Shared "connect a wallet" screen for every ephemeral-connect call site in
 * the app: deposit, funding the vault's withdrawal gas, and picking a
 * withdrawal destination. `purpose` picks the screen's copy and, on a
 * successful connect, which screen to hand the freshly-connected account
 * off to — via `navigation.replace`, not a callback threaded through route
 * params: this screen has nothing useful left to show once connected, and
 * `replace` keeps it out of the back stack instead of leaving a dead
 * "Connect a wallet" screen a user could swipe back into.
 */
import { useState } from 'react';
import {
  connectEphemeralWallet,
  EPHEMERAL_WALLET_OPTIONS,
  type EphemeralWalletProviderKey,
} from '../utils/connectEphemeralWallet';
import { WalletPickerView } from '../views/WalletPickerView';
import { findVaultAccount } from '../utils/vault';
import type { RouteProps } from '../navigation';

type Purpose = RouteProps<'ConnectWallet'>['route']['params']['purpose'];

const SUBTITLES: Record<Purpose, string> = {
  deposit: 'Connect a wallet to deposit USDC into your vault.',
  'fund-gas': "Connect a wallet to fund your vault's gas.",
  'withdraw-destination': 'Connect a wallet to receive your withdrawal.',
};

/** Forces a compile error if `purpose` ever grows a case this switch
 * doesn't handle — see handleSelect below. Without this, extending
 * `Purpose` to a union in a later PR without adding a matching branch would
 * compile cleanly and just silently hang (spinner never clears, no
 * navigation) the moment that case is actually hit. */
function assertUnreachable(value: never): never {
  throw new Error(`Unhandled ConnectWallet purpose: ${String(value)}`);
}

export function ConnectWalletRoute({
  navigation,
  route,
}: RouteProps<'ConnectWallet'>) {
  const { purpose } = route.params;
  const [connectingKey, setConnectingKey] = useState<string>();
  const [error, setError] = useState<string>();

  async function handleSelect(key: string) {
    setConnectingKey(key);
    setError(undefined);
    try {
      const externalAccount = await connectEphemeralWallet(
        key as EphemeralWalletProviderKey,
      );
      switch (purpose) {
        case 'deposit':
          navigation.replace('Deposit', { externalAccount });
          break;
        case 'fund-gas': {
          const vaultAccount = findVaultAccount();
          if (!vaultAccount) {
            // Unreachable in practice — every ConnectWallet purpose is only
            // ever reached from a screen navigation.tsx's own invariant
            // already guarantees a vault exists for.
            throw new Error("Couldn't find your vault.");
          }
          navigation.replace('FundGas', {
            vaultAddress: vaultAccount.address,
            externalAccount,
          });
          break;
        }
        case 'withdraw-destination': {
          const vaultAccount = findVaultAccount();
          if (!vaultAccount) {
            throw new Error("Couldn't find your vault.");
          }
          navigation.replace('WithdrawAmount', {
            vaultAccount,
            externalAccount,
          });
          break;
        }
        default:
          assertUnreachable(purpose);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect wallet.');
      setConnectingKey(undefined);
    }
  }

  return (
    <WalletPickerView
      screenSubtitle={SUBTITLES[purpose]}
      wallets={[...EPHEMERAL_WALLET_OPTIONS]}
      connectingKey={connectingKey}
      isConnecting={!!connectingKey}
      error={error}
      onSelect={handleSelect}
      onBack={() => navigation.goBack()}
    />
  );
}
