/**
 * Wallet picker screen: a call-site-supplied subtitle plus a vertical list
 * of connectable wallets, each rendered as a ListRow. Purely prop-driven —
 * this view has no notion of *why* it's being shown (deposit / fund-gas /
 * withdraw-destination all reuse it with a different screenSubtitle and
 * wallets list from their own route).
 *
 * No divider between rows: ListRow's own icon+label+chevron row already
 * carries enough visual weight (padding, pressed/disabled states) that a
 * hairline between entries would be redundant rather than clarifying.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { ListRow } from '../components/ListRow';
import { ErrorText } from '../components/ErrorText';
import { colors, spacing, typography } from '../consts/theme';

export type WalletOption = {
  key: string;
  label: string;
  iconUri?: string;
};

type WalletPickerViewProps = {
  /** e.g. "Connect a wallet to fund your vault's gas" — varies per call
   * site, passed in fully-formed. */
  screenSubtitle: string;
  wallets: WalletOption[];
  onSelect: (key: string) => void;
  /** Which wallet's ListRow shows isLoading. */
  connectingKey?: string;
  /** True whenever any connect is in flight — disables all rows besides
   * connectingKey. */
  isConnecting: boolean;
  error?: string;
  onBack: () => void;
};

export function WalletPickerView({
  screenSubtitle,
  wallets,
  onSelect,
  connectingKey,
  isConnecting,
  error,
  onBack,
}: WalletPickerViewProps) {
  return (
    <Screen>
      <Header title="Connect a wallet" onBack={onBack} />

      <Text style={styles.subtitle}>{screenSubtitle}</Text>

      <View style={styles.list}>
        {wallets.map(wallet => (
          <ListRow
            key={wallet.key}
            label={wallet.label}
            iconUri={wallet.iconUri}
            isLoading={connectingKey === wallet.key}
            disabled={isConnecting && connectingKey !== wallet.key}
            onPress={() => onSelect(wallet.key)}
          />
        ))}
      </View>

      {error ? <ErrorText>{error}</ErrorText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: colors.foregroundSecondary,
    marginTop: spacing.sm,
    ...typography.body,
  },
  list: {
    marginTop: spacing.lg,
  },
});
