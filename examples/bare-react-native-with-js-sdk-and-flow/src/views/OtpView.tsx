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
  email: string;
  code: string;
  onChangeCode: (value: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  isResending: boolean;
  error?: string;
  /** > 0 disables/labels the Resend link as a countdown instead of "Resend code". */
  resendCooldownSeconds?: number;
};

// number-pad has no "Done" key on iOS, so this pairs the code field with its
// own accessory toolbar above the keyboard — same convention as
// DepositForm.tsx's amount field, with its own unique nativeID so this
// screen's accessory view doesn't collide with LoginView's.
const CODE_INPUT_ACCESSORY_ID = 'otp-code-done';

/**
 * Second screen of the login flow — reachable only from LoginView, so it's
 * the one screen of these four with a Header/back button (back returns to
 * Login, per the caller's onBack). Purely prop-driven: the caller owns the
 * code field's state, the verify/resend mutations, and any cooldown timer
 * behind resendCooldownSeconds.
 */
export function OtpView({
  email,
  code,
  onChangeCode,
  onSubmit,
  onResend,
  onBack,
  isSubmitting,
  isResending,
  error,
  resendCooldownSeconds,
}: Props) {
  const isOnCooldown = !!resendCooldownSeconds && resendCooldownSeconds > 0;

  return (
    <Screen scrollsWithKeyboard={true}>
      <Header title="Enter code" onBack={onBack} />

      <Text style={styles.subtitle}>{`We sent a code to ${email}.`}</Text>

      <TextInput
        style={styles.input}
        placeholder="000000"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={onChangeCode}
        editable={!isSubmitting}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        inputAccessoryViewID={
          Platform.OS === 'ios' ? CODE_INPUT_ACCESSORY_ID : undefined
        }
      />
      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={CODE_INPUT_ACCESSORY_ID}>
          <View style={styles.accessoryBar}>
            <LinkButton title="Done" onPress={Keyboard.dismiss} hitSlop={8} />
          </View>
        </InputAccessoryView>
      ) : null}

      <PrimaryButton
        title="Verify"
        loading={isSubmitting}
        disabled={isSubmitting || code.length < 6}
        onPress={onSubmit}
      />

      <View style={styles.resendRow}>
        {isOnCooldown ? (
          <LinkButton
            title={`Resend in ${resendCooldownSeconds}s`}
            disabled={true}
            onPress={onResend}
          />
        ) : (
          <LinkButton
            title="Resend code"
            disabled={isResending}
            onPress={onResend}
          />
        )}
      </View>

      {error ? <ErrorText>{error}</ErrorText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: colors.foregroundSecondary,
    marginBottom: spacing.lg,
    ...typography.body,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.foreground,
    marginBottom: spacing.md,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
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
  resendRow: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
});
