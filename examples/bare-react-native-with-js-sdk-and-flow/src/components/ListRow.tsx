import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../consts/theme';
import { ChevronRightIcon } from './icons';

type ListRowProps = {
  label: string;
  /** Wallet/provider icon, e.g. a WalletConnect catalog entry's spriteUrl.
   * Falls back to a plain circle with the label's first letter when absent
   * (not every provider in the catalog ships an icon). */
  iconUri?: string;
  onPress: () => void;
  /** Replaces the trailing chevron with a spinner — the row currently being
   * connected to, in WalletPickerView. */
  isLoading?: boolean;
  disabled?: boolean;
};

/**
 * A single tappable row: leading icon, label, trailing chevron/spinner.
 * Built for WalletPickerView's wallet list (MetaMask + WalletConnect catalog
 * entries), kept generic enough that any future "pick one of these" screen
 * in this app can reuse it instead of hand-rolling another Pressable row.
 */
export function ListRow({
  label,
  iconUri,
  onPress,
  isLoading = false,
  disabled = false,
}: ListRowProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.row,
        pressed && !isDisabled && styles.rowPressed,
        isDisabled && !isLoading && styles.rowDisabled,
      ]}
    >
      {iconUri ? (
        <Image source={{ uri: iconUri }} style={styles.icon} />
      ) : (
        <View style={styles.iconFallback}>
          <Text style={styles.iconFallbackText}>
            {label.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {isLoading ? (
        <ActivityIndicator color={colors.muted} />
      ) : (
        <ChevronRightIcon size={16} color={colors.muted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
  },
  iconFallback: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFallbackText: {
    color: colors.foregroundSecondary,
    ...typography.label,
  },
  label: {
    flex: 1,
    color: colors.foreground,
    ...typography.body,
  },
});
