/**
 * Connects an external wallet for exactly one operation (a deposit, a
 * gas top-up, a withdrawal destination) — never persisted to Dynamic's
 * wallet-account list, never signature-verified. This is the redesign's
 * whole point: "always let the user connect to the wallet they want for
 * the operation they want, then discard it — we don't care about it
 * afterward" (see README's top-of-file Status note).
 *
 * `addToDynamicWalletAccounts: false` on every connect call (see
 * connectMetaMask.ts/connectCatalogWallet.ts) is what makes that true at
 * the Dynamic-bookkeeping level — the connected account never appears in
 * getWalletAccounts(). Actually *closing* the underlying provider session
 * afterward is a separate concern this SDK version has no public API for
 * (see this app's git history for `discardEphemeralWallet.ts`, removed
 * since it was a no-op — `disconnectWalletAccount` isn't re-exported from
 * any public barrel in the installed `@dynamic-labs-sdk/client` version).
 */
import { connectMetaMask } from './connectMetaMask';
import { connectCatalogWallet } from './connectCatalogWallet';
import type { EvmWalletAccount } from '@dynamic-labs-sdk/evm';

/**
 * The wallets offered in WalletPickerView for every ephemeral-connect
 * purpose in this app. MetaMask connects via its own SDK/deep-link flow
 * (not the generic WalletConnect catalog); the rest are resolved by key
 * from getWalletConnectCatalog() — a small curated set rather than the
 * catalog's full wallet list, which is large enough that surfacing all of
 * it would need a search/filter UI beyond this demo's scope.
 */
export const EPHEMERAL_WALLET_OPTIONS = [
  { key: 'metamask', label: 'MetaMask' },
  { key: 'trust', label: 'Trust Wallet' },
  { key: 'rainbow', label: 'Rainbow' },
] as const;

export type EphemeralWalletProviderKey =
  (typeof EPHEMERAL_WALLET_OPTIONS)[number]['key'];

/** Connects the wallet identified by `key`, ephemerally (see file-level
 * comment). Opens the appropriate deep link and resolves once the user
 * approves in their wallet app. */
export async function connectEphemeralWallet(
  key: EphemeralWalletProviderKey,
): Promise<EvmWalletAccount> {
  if (key === 'metamask') {
    return connectMetaMask();
  }
  return connectCatalogWallet(key);
}
