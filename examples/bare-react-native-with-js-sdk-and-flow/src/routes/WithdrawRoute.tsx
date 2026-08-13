/**
 * Withdraw entry point: checks the vault's native ETH balance (it pays its
 * own withdrawal gas — this app doesn't sponsor gas, a paymaster/smart-
 * account rabbit hole out of scope here) before ever showing an amount
 * field. Mirrors the pre-redesign WithdrawForm.tsx's gas-check-first design,
 * now as the stateful hub for a small multi-screen sub-flow instead of one
 * component switching between inline views:
 *
 *   insufficient gas -> ConnectWallet(fund-gas) -> FundGas -> back here
 *   (now with reusableExternalAccount) -> offer to reuse it or connect a
 *   new one for the withdrawal destination -> WithdrawAmount
 *
 * The five states below (checking / error / insufficient gas / choose
 * destination with a reuse option / connect fresh) are simple enough, and
 * specific enough to this one route, that they're rendered with a small
 * local `Prompt` helper composed from existing dumb components rather than
 * five separate views/*.tsx files — none of them has any reuse beyond this
 * screen.
 */
import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { parseEther } from 'viem';
import { ErrorText } from '../components/ErrorText';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { SecondaryButton } from '../components/SecondaryButton';
import { MIN_VAULT_GAS_ETH } from '../consts/flow';
import { colors, spacing, typography } from '../consts/theme';
import { getNativeBalance } from '../utils/getNativeBalance';
import { findVaultAccount } from '../utils/vault';
import { shortAddress } from '../utils/shortAddress';
import type { RouteProps } from '../navigation';

type PromptProps = {
  children: React.ReactNode;
  onBack: () => void;
};

/** Shared "Withdraw" header + centered body used by every state below. */
function Prompt({ children, onBack }: PromptProps) {
  return (
    <Screen>
      <Header title="Withdraw" onBack={onBack} />
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

export function WithdrawRoute({ navigation, route }: RouteProps<'Withdraw'>) {
  const reusableExternalAccount = route.params?.reusableExternalAccount;
  const vaultAccount = findVaultAccount();

  const vaultGasQuery = useQuery({
    queryKey: ['vault-native-balance', vaultAccount?.address],
    queryFn: () => getNativeBalance(vaultAccount!.address),
    enabled: !!vaultAccount,
  });
  const hasEnoughGas =
    vaultGasQuery.data !== undefined &&
    vaultGasQuery.data >= parseEther(MIN_VAULT_GAS_ETH);

  // FundGasRoute lands back here via `popTo(..., {merge: true})` — the
  // *existing* WithdrawRoute instance, not a fresh mount — specifically so
  // the back-stack doesn't accumulate a duplicate Withdraw screen (see
  // FundGasRoute.tsx's own comment). The cost of reusing the instance
  // instead of remounting: react-query has no reason to refetch
  // `vaultGasQuery` on its own just because `route.params` changed — its
  // queryKey is keyed on the vault's address, which never changes. Without
  // this effect, a user who just funded their vault would land back here
  // still looking at the stale pre-top-up "insufficient gas" result.
  // `reusableExternalAccount` only ever newly appears right after a
  // successful top-up, so it's the right signal to force this one refetch.
  useEffect(() => {
    if (reusableExternalAccount) {
      vaultGasQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reusableExternalAccount]);

  const onBack = () => navigation.goBack();

  if (!vaultAccount) {
    // Unreachable in practice — same invariant as HomeRoute/DepositRoute.
    return null;
  }

  if (vaultGasQuery.isPending) {
    return (
      <Prompt onBack={onBack}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.text}>Checking your vault's ETH balance…</Text>
      </Prompt>
    );
  }

  if (vaultGasQuery.isError) {
    return (
      <Prompt onBack={onBack}>
        <ErrorText style={styles.errorSpaced}>
          Couldn't check your vault's ETH balance. Check your connection and try
          again.
        </ErrorText>
        <PrimaryButton title="Retry" onPress={() => vaultGasQuery.refetch()} />
      </Prompt>
    );
  }

  if (!hasEnoughGas) {
    return (
      <Prompt onBack={onBack}>
        <Text style={styles.text}>
          Your vault doesn't have enough ETH to pay for a withdrawal's gas on
          Base. Connect a wallet to send a small top-up.
        </Text>
        <PrimaryButton
          title="Fund your vault"
          style={styles.actionSpacing}
          onPress={() =>
            navigation.navigate('ConnectWallet', { purpose: 'fund-gas' })
          }
        />
      </Prompt>
    );
  }

  if (reusableExternalAccount) {
    return (
      <Prompt onBack={onBack}>
        <Text style={styles.text}>
          Choose which wallet should receive your withdrawal.
        </Text>
        <PrimaryButton
          title={`Use ${shortAddress(reusableExternalAccount.address)}`}
          style={styles.actionSpacing}
          onPress={() =>
            navigation.replace('WithdrawAmount', {
              vaultAccount,
              externalAccount: reusableExternalAccount,
            })
          }
        />
        <SecondaryButton
          title="Connect a different wallet"
          style={styles.actionSpacing}
          onPress={() =>
            navigation.navigate('ConnectWallet', {
              purpose: 'withdraw-destination',
            })
          }
        />
      </Prompt>
    );
  }

  return (
    <Prompt onBack={onBack}>
      <Text style={styles.text}>
        Connect a wallet to receive your withdrawal.
      </Text>
      <PrimaryButton
        title="Connect a wallet"
        style={styles.actionSpacing}
        onPress={() =>
          navigation.navigate('ConnectWallet', {
            purpose: 'withdraw-destination',
          })
        }
      />
    </Prompt>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  text: {
    ...typography.body,
    color: colors.foregroundSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  errorSpaced: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  actionSpacing: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
