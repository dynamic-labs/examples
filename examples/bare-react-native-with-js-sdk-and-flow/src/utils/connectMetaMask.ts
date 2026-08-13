/**
 * Connects MetaMask for exactly one operation — never persisted to
 * Dynamic's wallet-account list (`addToDynamicWalletAccounts: false`), see
 * connectEphemeralWallet.ts's file-level comment for the full rationale.
 * Uses Dynamic's own MetaMask SDK wrapper (a deep link, not the generic
 * WalletConnect catalog — see connectCatalogWallet.ts for the rest).
 */
import { appendConnectionUriToDeeplink } from '@dynamic-labs-sdk/client';
import { connectWithMetaMaskUriEvm } from '@dynamic-labs-sdk/evm/metamask';
import type { EvmWalletAccount } from '@dynamic-labs-sdk/evm';
import { Linking } from 'react-native';
import { resolveWalletAccounts } from './resolveWalletAccounts';

const METAMASK_DEEPLINK = 'https://metamask.app.link/wc';

export async function connectMetaMask(): Promise<EvmWalletAccount> {
  const { uri, approval } = await connectWithMetaMaskUriEvm({
    addToDynamicWalletAccounts: false,
  });
  const deeplink = appendConnectionUriToDeeplink({
    connectionUri: uri,
    deeplinkUrl: METAMASK_DEEPLINK,
  });
  Linking.openURL(deeplink);
  return resolveWalletAccounts(approval);
}
