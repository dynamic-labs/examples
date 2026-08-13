/**
 * Dumb, prop-driven "fund your vault's gas" view — the presentational half
 * of FundVaultGasForm.tsx's screen. All the actual top-up mechanics
 * (external-wallet balance preflight, network switch, transferAmount,
 * confirmTransaction, the vault-gas-balance refetch) stay in the route/
 * widget that renders this; this view only knows about the hint copy, the
 * "Send N ETH to vault" button, and the busy/step-label/error layout below
 * it — ported verbatim from FundVaultGasForm.tsx's render.
 */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ErrorText } from '../components/ErrorText';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { colors, spacing, typography } from '../consts/theme';

type Props = {
  topupAmountEth: string;
  onFund: () => void;
  isPending: boolean;
  stepLabel?: string;
  error?: string;
  onBack: () => void;
};

export function FundGasView({
  topupAmountEth,
  onFund,
  isPending,
  stepLabel,
  error,
  onBack,
}: Props) {
  return (
    <Screen>
      {/* onBack withheld while pending, same as AmountView.tsx — the
       * Header's Back is the only way out of this screen now, so it carries
       * the "can't leave mid-transfer" rule itself instead of a second,
       * redundant link duplicating it below the button (which is what this
       * used to be, back when FundVaultGasForm.tsx had no Header at all). */}
      <Header title="Fund your vault" onBack={isPending ? undefined : onBack} />

      <Text style={styles.hint}>
        Your vault doesn't have enough ETH to pay for a withdrawal's gas on
        Base. Send a small top-up from your connected wallet to continue.
      </Text>

      <PrimaryButton
        title={`Send ${topupAmountEth} ETH to vault`}
        loading={isPending}
        onPress={onFund}
      />

      {isPending && stepLabel ? (
        <Text style={styles.stepLabel}>{stepLabel}</Text>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...typography.caption,
    color: colors.foregroundSecondary,
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.foregroundSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
