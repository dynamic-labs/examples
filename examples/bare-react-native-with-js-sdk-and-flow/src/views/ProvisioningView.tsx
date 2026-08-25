import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ErrorText } from '../components/ErrorText';
import { AlertCircleIcon } from '../components/icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { colors, spacing, typography } from '../consts/theme';

type Props = {
  /** Defaults to "Setting up your vault…" if omitted. */
  message?: string;
  error?: string;
  /** Only rendered when `error` is set — there's no Cancel/Back on this
   * screen (see below), so Retry is the only way forward. */
  onRetry?: () => void;
  /** Disables/spins the Retry button while a retry is in flight — without
   * this, a double-tap can fire two concurrent vault-creation calls, which
   * the original VaultProvisioning.tsx explicitly guarded against via its
   * own `loading={isPending}`. */
  isRetrying?: boolean;
};

const DEFAULT_MESSAGE = 'Setting up your vault…';

/**
 * Reached automatically right after OTP success, while the embedded wallet
 * ("vault") is being created — no Header, since this screen isn't reachable
 * via back navigation and, unlike the other three views, has nothing
 * meaningful to go back *to*: the vault is required to use the rest of the
 * app at all. If provisioning fails, the only action is Retry — no Cancel,
 * for the same reason. Error copy (e.g. "embedded wallets aren't enabled
 * for this Dynamic environment") is the caller's responsibility to supply
 * via `error`, mirroring the real failure modes in VaultProvisioning.tsx.
 */
export function ProvisioningView({
  message,
  error,
  onRetry,
  isRetrying = false,
}: Props) {
  if (error) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AlertCircleIcon size={56} color={colors.error} />
          <Text style={styles.errorTitle}>Couldn't set up your vault</Text>
          <ErrorText style={styles.errorText}>{error}</ErrorText>
          {onRetry ? (
            <PrimaryButton
              title="Retry"
              loading={isRetrying}
              style={styles.retryButton}
              onPress={onRetry}
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.message}>{message ?? DEFAULT_MESSAGE}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  message: {
    color: colors.foregroundSecondary,
    marginTop: spacing.md,
    ...typography.body,
  },
  errorTitle: {
    color: colors.foreground,
    marginTop: spacing.md,
    textAlign: 'center',
    ...typography.headline,
  },
  errorText: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  retryButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
