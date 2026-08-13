/**
 * Dumb, prop-driven amount entry view — shared shape for Deposit and
 * Withdraw, which differ only in copy (title/hint/submitLabel) and in
 * whether there's a destination-wallet row to show below the hint (see
 * `footer`). All amount-flow mechanics (create -> attach source -> quote ->
 * submit, validation, busy state) stay in the route/widget that renders this
 * — this component only knows about the amount TextInput, the hint/error
 * text, and the submit button, exactly like DepositForm.tsx/
 * WithdrawAmountForm.tsx's shared layout below their inputs.
 */
import React from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ErrorText } from '../components/ErrorText';
import { Header } from '../components/Header';
import { LinkButton } from '../components/LinkButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, typography } from '../consts/theme';

type Props = {
  title: string;
  hint: string;
  amount: string;
  onChangeAmount: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  stepLabel?: string;
  error?: string;
  amountErrorText?: string;
  onBack: () => void;
  /** Composable slot rendered between the hint and the submit button — e.g.
   * a "Sending to 0x123…abcd [Change]" row that WithdrawAmountRoute injects
   * for the withdraw case but DepositRoute doesn't use at all. This view
   * has no idea what a "destination wallet" is — that's the whole point of
   * this slot. */
  footer?: React.ReactNode;
};

// decimal-pad/number-pad have no return key on iOS to hit "Done" with, so
// this pairs the amount field with its own accessory toolbar above the
// keyboard as the way to dismiss it — same pattern as DepositForm.tsx/
// WithdrawAmountForm.tsx, just under this view's own nativeID so the two
// don't collide if both ever mount at once.
const AMOUNT_INPUT_ACCESSORY_ID = 'amount-view-done';

export function AmountView({
  title,
  hint,
  amount,
  onChangeAmount,
  onSubmit,
  submitLabel,
  isSubmitting,
  canSubmit,
  stepLabel,
  error,
  amountErrorText,
  onBack,
  footer,
}: Props) {
  return (
    <Screen scrollsWithKeyboard={true}>
      {/* onBack is withheld while submitting rather than just hiding a
       * second Back affordance below the button (which is what this used
       * to be, back when DepositForm.tsx/WithdrawAmountForm.tsx had no
       * Header at all) — the Header's Back is now the only way out of this
       * screen, so it has to carry that same "can't leave mid-submit" rule
       * itself instead of a redundant link duplicating it further down. */}
      <Header title={title} onBack={isSubmitting ? undefined : onBack} />

      <Text style={styles.label}>Amount (USD)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor={colors.muted}
        // decimal-pad, not numeric: numeric renders a full punctuation
        // keyboard on iOS, which is overkill for an amount field. The
        // device's own region setting decides whether that shows a period
        // or a comma as the decimal key — normalizing that is the caller's
        // job (see DepositForm.tsx's normalizeAmount), not this view's.
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={onChangeAmount}
        editable={!isSubmitting}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        inputAccessoryViewID={
          Platform.OS === 'ios' ? AMOUNT_INPUT_ACCESSORY_ID : undefined
        }
      />
      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={AMOUNT_INPUT_ACCESSORY_ID}>
          <View style={styles.accessoryBar}>
            <LinkButton title="Done" onPress={Keyboard.dismiss} hitSlop={8} />
          </View>
        </InputAccessoryView>
      ) : null}

      <Text style={styles.hint}>{hint}</Text>

      {amountErrorText ? (
        <ErrorText style={styles.amountErrorSpaced}>
          {amountErrorText}
        </ErrorText>
      ) : null}

      {footer}

      <PrimaryButton
        title={submitLabel}
        loading={isSubmitting}
        disabled={!canSubmit}
        onPress={onSubmit}
      />

      {isSubmitting && stepLabel ? (
        <Text style={styles.stepLabel}>{stepLabel}</Text>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.foregroundSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.foregroundSecondary,
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  amountErrorSpaced: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.foregroundSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  accessoryBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
