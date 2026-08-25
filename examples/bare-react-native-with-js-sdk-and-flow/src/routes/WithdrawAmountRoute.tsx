/**
 * Amount-only withdrawal: vault -> the destination wallet chosen in
 * WithdrawRoute.tsx (route.params). Paid in USDC from the vault, settled as
 * native ETH to the destination — the reverse of DepositRoute.tsx's
 * ETH-in/USDC-out. Same create -> attach source -> quote -> submit sequence,
 * with source/destination swapped and the vault signing directly (no
 * external-wallet-app hand-off, unlike Deposit).
 *
 * The `footer` slot (see AmountView.tsx) shows the chosen destination
 * address with a "Change" link back into wallet selection — this view has
 * no idea what a destination wallet even is, which is the point of that
 * slot existing at all.
 */
import {
  attachFlowSource,
  getFlowQuote,
  submitFlowTransaction,
} from '@dynamic-labs-sdk/client';
import { useGetTokenBalances } from '@dynamic-labs-sdk/react-hooks';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AmountView } from '../views/AmountView';
import { LinkButton } from '../components/LinkButton';
import { config } from '../consts/config';
import { MAX_AMOUNT_USD } from '../consts/flow';
import { colors, radii, spacing, typography } from '../consts/theme';
import { createWithdrawFlow } from '../utils/createWithdrawFlow';
import { normalizeAmount } from '../utils/normalizeAmount';
import { isValidAmount } from '../utils/isValidAmount';
import { shortAddress } from '../utils/shortAddress';
import type { RouteProps } from '../navigation';

type Step =
  | 'idle'
  | 'creating'
  | 'attaching'
  | 'quoting'
  | 'awaiting-approval'
  | 'error';

const BUSY_STEPS: ReadonlySet<Step> = new Set([
  'creating',
  'attaching',
  'quoting',
  'awaiting-approval',
]);

const STEP_LABELS: Partial<Record<Step, string>> = {
  creating: 'Creating withdrawal…',
  attaching: 'Attaching your vault…',
  quoting: 'Getting a quote…',
  'awaiting-approval': 'Signing with your vault…',
};

export function WithdrawAmountRoute({
  navigation,
  route,
}: RouteProps<'WithdrawAmount'>) {
  const { vaultAccount, externalAccount } = route.params;
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [submitStepLabel, setSubmitStepLabel] = useState<string | null>(null);
  const isBusy = BUSY_STEPS.has(step);

  const { data: tokenBalances } = useGetTokenBalances({
    walletAccount: vaultAccount,
    networkId: config.chainIdNumber,
    whitelistedContracts: [config.usdcAddress],
  });
  const vaultBalance =
    tokenBalances?.find(
      token => token.address.toLowerCase() === config.usdcAddress.toLowerCase(),
    )?.balance ?? 0;

  const amountExceedsBalance =
    amount.length > 0 && Number(normalizeAmount(amount)) > vaultBalance;
  const canSubmit =
    !isBusy && isValidAmount(amount, Math.min(MAX_AMOUNT_USD, vaultBalance));

  const {
    mutate: handleSubmit,
    isPending: isSubmitting,
    error,
  } = useMutation({
    mutationFn: async ({ amount: submittedAmount }: { amount: string }) => {
      setSubmitStepLabel(null);
      setStep('creating');

      const normalizedAmount = normalizeAmount(submittedAmount);

      const flowId = await createWithdrawFlow({
        amount: normalizedAmount,
        destinationAddress: externalAccount.address,
      });

      setStep('attaching');

      await attachFlowSource({
        flowId,
        sourceType: 'wallet',
        fromAddress: vaultAccount.address,
        fromChainId: config.chainId,
        fromChainName: 'EVM',
      });

      setStep('quoting');

      // fromTokenAddress is what actually picks the vault's paying asset —
      // attachFlowSource's wallet-source params have no token field at all,
      // so without this, getFlowQuote defaults to the chain's native token
      // (ETH) regardless of what the vault holds. This is the one place
      // that makes the vault actually spend its USDC instead of its ETH
      // gas float — confirmed against Dynamic's own demo-dashboard
      // reference (github.com/dynamic-labs-oss/demo-dashboard), whose
      // withdraw flow passes this same param for exactly this reason.
      await getFlowQuote({ flowId, fromTokenAddress: config.usdcAddress });

      setStep('awaiting-approval');

      await submitFlowTransaction({
        flowId,
        walletAccount: vaultAccount,
        onStepChange: submitStep => {
          if (submitStep === 'approval') {
            setSubmitStepLabel('Signing with your vault…');
          } else if (submitStep === 'transaction') {
            setSubmitStepLabel('Broadcasting transaction…');
          }
        },
      });

      navigation.replace('FlowStatus', { flowId, direction: 'withdraw' });
    },
    onError: () => {
      setStep('error');
      setSubmitStepLabel(null);
    },
  });

  return (
    <AmountView
      title="Withdraw"
      hint={`Paid in USDC from your vault, settled as ETH on Base mainnet to your connected wallet. Capped at $${MAX_AMOUNT_USD} for this demo and by your vault's current USDC balance ($${vaultBalance.toFixed(
        2,
      )}).`}
      amount={amount}
      onChangeAmount={setAmount}
      onSubmit={() => handleSubmit({ amount })}
      submitLabel="Withdraw"
      isSubmitting={isSubmitting}
      canSubmit={canSubmit}
      amountErrorText={
        amountExceedsBalance
          ? "Amount exceeds your vault's balance."
          : undefined
      }
      stepLabel={
        isSubmitting ? submitStepLabel ?? STEP_LABELS[step] : undefined
      }
      error={error?.message}
      footer={
        <View style={styles.destinationRow}>
          <Text style={styles.destinationText}>
            Sending to {shortAddress(externalAccount.address)}
          </Text>
          {!isBusy ? (
            <LinkButton
              title="Change"
              onPress={() =>
                navigation.navigate('ConnectWallet', {
                  purpose: 'withdraw-destination',
                })
              }
            />
          ) : null}
        </View>
      }
      onBack={() => navigation.goBack()}
    />
  );
}

const styles = StyleSheet.create({
  destinationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.divider,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  destinationText: {
    ...typography.body,
    color: colors.foregroundSecondary,
  },
});
