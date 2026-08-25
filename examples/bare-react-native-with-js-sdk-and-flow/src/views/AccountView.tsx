/**
 * Account screen: the signed-in email plus a Log out action. Purely
 * prop-driven — AccountRoute owns the useLogout mutation and passes down its
 * isPending/error state instead of this view calling the SDK itself.
 *
 * The Log out action reuses LinkButton with tone="danger", matching the
 * destructive-action styling ConnectedWallet.tsx already established for its
 * own Logout button — a single visual language for "sign the user out"
 * across both the old chip-based header and this screen.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { ErrorText } from '../components/ErrorText';
import { LinkButton } from '../components/LinkButton';
import { colors, spacing, typography } from '../consts/theme';

type AccountViewProps = {
  email: string;
  onLogout: () => void;
  onBack: () => void;
  isLoggingOut: boolean;
  error?: string;
};

export function AccountView({
  email,
  onLogout,
  onBack,
  isLoggingOut,
  error,
}: AccountViewProps) {
  return (
    <Screen>
      <Header title="Account" onBack={onBack} />

      <View style={styles.row}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{email}</Text>
      </View>

      <View style={styles.logoutRow}>
        <LinkButton
          title={isLoggingOut ? 'Logging out…' : 'Log out'}
          tone="danger"
          onPress={onLogout}
          disabled={isLoggingOut}
        />
      </View>

      {error ? <ErrorText>{error}</ErrorText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: spacing.lg,
  },
  label: {
    color: colors.foregroundSecondary,
    ...typography.label,
  },
  value: {
    color: colors.foreground,
    marginTop: spacing.xs,
    ...typography.body,
  },
  logoutRow: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
});
