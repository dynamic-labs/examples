/**
 * Vault dashboard: balance + Deposit/Withdraw entry points + an account menu
 * button. Owns the vault (WaaS wallet) lookup and its USDC balance polling —
 * HomeView itself is purely prop-driven (see its own file for why the
 * gradient-card JSX is a near-verbatim port of the old VaultBalanceCard.tsx).
 *
 * Both onDeposit and onWithdraw are wired for real — Withdraw's own
 * gas-check/fund-gas/destination-reuse sub-flow lives in WithdrawRoute.tsx.
 */
import { useGetWalletAccounts } from '@dynamic-labs-sdk/react-hooks';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { HomeView } from '../views/HomeView';
import { getUsdcBalance } from '../utils/getUsdcBalance';
import { findVaultAccount } from '../utils/vault';
import type { RouteProps } from '../navigation';

export function HomeRoute({ navigation }: RouteProps<'Home'>) {
  const walletAccountsQuery = useGetWalletAccounts();

  // Navigation.tsx's own initialRouteName check already guarantees this
  // screen is never reached without a vault existing, so `vaultAccount`
  // being undefined here would mean that invariant broke, not a normal
  // loading state. Re-derived via useMemo (not just findVaultAccount()
  // called plain) so this component still re-renders reactively when
  // walletAccountsQuery's data changes, even though findVaultAccount()
  // itself reads a synchronous, always-current snapshot either way.
  const vaultAccount = useMemo(() => {
    return findVaultAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAccountsQuery.data]);

  // Reads the vault's USDC balance directly on-chain rather than through
  // useGetTokenBalances — that hook is backed by Dynamic's own balances API
  // (an indexer), which can lag a very recent transfer by several minutes
  // even with forceRefresh: true. A direct balanceOf call has no such lag:
  // it's always exactly what's on-chain right now. See getUsdcBalance.ts.
  const {
    data: usdcBalanceRaw,
    isPending: isBalancePending,
    isFetching: isBalanceFetching,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['vault-usdc-balance', vaultAccount?.address],
    queryFn: () => getUsdcBalance(vaultAccount!.address),
    enabled: !!vaultAccount,
    refetchInterval: 3000,
  });

  const usdcBalance = Number(formatUnits(usdcBalanceRaw ?? 0n, 6));

  if (!vaultAccount) {
    // Unreachable in practice (see the comment on `vaultAccount` above) —
    // keeps this component exhaustively typed rather than passing a
    // possibly-undefined address into HomeView's non-optional prop.
    return null;
  }

  return (
    <HomeView
      balanceUsd={isBalancePending ? undefined : usdcBalance}
      vaultAddress={vaultAccount.address}
      onDeposit={() =>
        navigation.navigate('ConnectWallet', { purpose: 'deposit' })
      }
      onWithdraw={() => navigation.navigate('Withdraw', {})}
      onOpenAccount={() => navigation.navigate('Account')}
      onRefresh={() => refetchBalance()}
      isRefreshing={isBalanceFetching}
    />
  );
}
