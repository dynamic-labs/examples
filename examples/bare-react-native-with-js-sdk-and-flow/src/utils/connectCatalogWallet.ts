/**
 * Connects a wallet from Dynamic's WalletConnect catalog (Trust Wallet,
 * Rainbow, …) for exactly one operation — never persisted
 * (`addToDynamicWalletAccounts: false`), see connectEphemeralWallet.ts's
 * file-level comment for the full rationale.
 */
import {
  appendConnectionUriToDeeplink,
  getWalletConnectCatalog,
} from '@dynamic-labs-sdk/client';
import { connectWithWalletConnectEvm } from '@dynamic-labs-sdk/evm/wallet-connect';
import type { EvmWalletAccount } from '@dynamic-labs-sdk/evm';
import { Linking } from 'react-native';
import { resolveWalletAccounts } from './resolveWalletAccounts';

export async function connectCatalogWallet(
  catalogKey: string,
): Promise<EvmWalletAccount> {
  const { uri, approval } = await connectWithWalletConnectEvm({
    addToDynamicWalletAccounts: false,
  });

  // Explicitly caught, not left to propagate: getWalletConnectCatalog's own
  // underlying fetchLegacyWalletBook throws if both the CDN fetch and the
  // local cache fail — mirrors the pre-redesign trustWalletConnect.ts's
  // established try/catch-around-the-catalog-call pattern for exactly that
  // failure mode, rather than only handling "fetched fine but this
  // key/deep link is missing" below.
  const wallet = await getWalletConnectCatalog()
    .then(catalog => catalog.wallets[catalogKey])
    .catch(() => undefined);
  const deeplinkBase =
    wallet?.deeplinks?.native ?? wallet?.deeplinks?.universal;

  if (deeplinkBase) {
    const deeplink = appendConnectionUriToDeeplink({
      deeplinkUrl: deeplinkBase,
      connectionUri: uri,
    });
    Linking.openURL(deeplink);
  } else {
    // Falls back to the raw wc: pairing URI rather than silently doing
    // nothing — the wallet app (if installed) can still often handle a
    // bare wc: link — whether the catalog fetch itself failed, or it
    // succeeded but this key/deep link was missing.
    Linking.openURL(uri);
  }

  return resolveWalletAccounts(approval);
}
