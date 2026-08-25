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
import { LinkButton } from '../components/LinkButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, typography } from '../consts/theme';

type Props = {
  email: string;
  onChangeEmail: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string;
};

// number-pad/email keyboards don't reliably surface a "Done" key on iOS, so
// this pairs the field with its own accessory toolbar above the keyboard —
// same convention as DepositForm.tsx's amount field, with its own unique
// nativeID so this screen's accessory view doesn't collide with OtpView's.
const EMAIL_INPUT_ACCESSORY_ID = 'login-email-done';

/**
 * First screen of the app — no Header, since it's the first thing rendered
 * once a session is known not to exist and there's nothing to go back to.
 * Purely prop-driven: the caller owns the email field's state, the
 * send-code mutation, and any navigation to OtpView once a code has gone
 * out.
 */
export function LoginView({
  email,
  onChangeEmail,
  onSubmit,
  isSubmitting,
  error,
}: Props) {
  return (
    <Screen scrollsWithKeyboard={true}>
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.subtitle}>
        Enter your email to get a one-time code.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        value={email}
        onChangeText={onChangeEmail}
        editable={!isSubmitting}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        inputAccessoryViewID={
          Platform.OS === 'ios' ? EMAIL_INPUT_ACCESSORY_ID : undefined
        }
      />
      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={EMAIL_INPUT_ACCESSORY_ID}>
          <View style={styles.accessoryBar}>
            <LinkButton title="Done" onPress={Keyboard.dismiss} hitSlop={8} />
          </View>
        </InputAccessoryView>
      ) : null}

      <PrimaryButton
        title="Continue"
        loading={isSubmitting}
        disabled={isSubmitting || email.trim().length === 0}
        onPress={onSubmit}
      />

      {error ? <ErrorText>{error}</ErrorText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.foreground,
    marginBottom: spacing.xs,
    ...typography.title,
  },
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
    ...typography.body,
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
