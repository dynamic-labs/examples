/**
 * Amount-only deposit: the just-connected external wallet (route.params,
 * see ConnectWalletRoute.tsx) -> vault. Drives the same create -> attach
 * source -> quote -> submit sequence the pre-redesign DepositForm.tsx did —
 * ported here as the "smart" half, with AmountView as the dumb one.
 */
import {
  attachFlowSource,
  getFlowQuote,
  submitFlowTransaction,
} from '@dynamic-labs-sdk/client';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { AmountView } from '../views/AmountView';
import { config } from '../consts/config';
import { MAX_AMOUNT_USD } from '../consts/flow';
import { createDepositFlow } from '../utils/createDepositFlow';
import { findVaultAccount } from '../utils/vault';
import { normalizeAmount } from '../utils/normalizeAmount';
import { isValidAmount } from '../utils/isValidAmount';
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
  creating: 'Creating deposit…',
  attaching: 'Attaching your wallet…',
  quoting: 'Getting a quote…',
  'awaiting-approval': 'Check your wallet to approve the transaction…',
};

export function DepositRoute({ navigation, route }: RouteProps<'Deposit'>) {
  const { externalAccount } = route.params;
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [submitStepLabel, setSubmitStepLabel] = useState<string | null>(null);
  const isBusy = BUSY_STEPS.has(step);
  const canSubmit = !isBusy && isValidAmount(amount, MAX_AMOUNT_USD);
  const vaultAddress = findVaultAccount()?.address;

  const {
    mutate: handleSubmit,
    isPending: isSubmitting,
    error,
  } = useMutation({
    mutationFn: async ({ amount: submittedAmount }: { amount: string }) => {
      if (!vaultAddress) {
        // Unreachable in practice — this screen is only ever reached from
        // Home, which (per navigation.tsx's own invariant) never renders
        // without a vault existing.
        throw new Error("Couldn't find your vault.");
      }

      setSubmitStepLabel(null);
      setStep('creating');

      const normalizedAmount = normalizeAmount(submittedAmount);

      const flowId = await createDepositFlow({
        amount: normalizedAmount,
        destinationAddress: vaultAddress,
      });

      setStep('attaching');

      await attachFlowSource({
        flowId,
        sourceType: 'wallet',
        fromAddress: externalAccount.address,
        fromChainId: config.chainId,
        fromChainName: 'EVM',
      });

      setStep('quoting');

      await getFlowQuote({ flowId });

      setStep('awaiting-approval');

      await submitFlowTransaction({
        flowId,
        walletAccount: externalAccount,
        onStepChange: submitStep => {
          if (submitStep === 'approval') {
            setSubmitStepLabel('Check your wallet to approve the transaction…');
          } else if (submitStep === 'transaction') {
            setSubmitStepLabel('Broadcasting transaction…');
          }
        },
      });

      navigation.replace('FlowStatus', { flowId, direction: 'deposit' });
    },
    onError: () => {
      setStep('error');
      setSubmitStepLabel(null);
    },
  });

  return (
    <AmountView
      title="Deposit"
      hint={`Paid in ETH on Base mainnet, settled as USDC into your vault. Capped at $${MAX_AMOUNT_USD} for this demo.`}
      amount={amount}
      onChangeAmount={setAmount}
      onSubmit={() => handleSubmit({ amount })}
      submitLabel="Deposit"
      isSubmitting={isSubmitting}
      canSubmit={canSubmit}
      stepLabel={
        isSubmitting ? submitStepLabel ?? STEP_LABELS[step] : undefined
      }
      error={error?.message}
      onBack={() => navigation.goBack()}
    />
  );
}
