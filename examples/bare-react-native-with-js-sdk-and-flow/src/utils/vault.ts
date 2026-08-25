/**
 * The vault (WaaS wallet), the same way App.tsx's old AppContent derived it
 * — distinct from any external wallet. Ephemeral, per-operation external
 * wallets (the redesign's whole point) never persist to this list at all,
 * so this stays exactly this simple even with Deposit/Withdraw connecting
 * wallets ad hoc. Shared by every route that needs "the vault" (Home,
 * Deposit, ConnectWallet, Withdraw, FundGas, WithdrawAmount) instead of each
 * re-deriving its own copy of this filter/find.
 */
import { getWalletAccounts } from '@dynamic-labs-sdk/client';
import { isWaasWalletAccount } from '@dynamic-labs-sdk/client/waas';
import {
  isEvmWalletAccount,
  type EvmWalletAccount,
} from '@dynamic-labs-sdk/evm';

export function findVaultAccount(): EvmWalletAccount | undefined {
  return getWalletAccounts()
    .filter(wallet => isEvmWalletAccount(wallet))
    .find(wallet => isWaasWalletAccount({ walletAccount: wallet }));
}

export function hasVault(): boolean {
  return !!findVaultAccount();
}
