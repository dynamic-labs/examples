/**
 * Home screen: a header with an account-icon button plus the vault balance
 * card (gradient hero) with Deposit/Withdraw entry points. Purely
 * prop-driven — HomeRoute owns the useGetTokenBalances polling and passes
 * the resolved balanceUsd/vaultAddress down here, along with the
 * Deposit/Withdraw/Refresh/Account callbacks.
 *
 * The gradient card below is ported near-verbatim from the pre-redesign
 * VaultBalanceCard.tsx (see that file's own comment for why the 3-layer
 * shadowWrapper/card/gradient structure exists, and why its styling is its
 * own translucent button/copy-chip look rather than PrimaryButton/
 * SecondaryButton). The only real differences here: data and callbacks come
 * from props instead of a useGetTokenBalances call, and there's no internal
 * 15s poll — HomeRoute owns that now.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import { Screen } from '../components/Screen';
import { Header } from '../components/Header';
import { Skeleton } from '../components/Skeleton';
import {
  DepositIcon,
  PersonIcon,
  RefreshIcon,
  WithdrawIcon,
} from '../components/icons';
import { colors, radii, spacing, typography } from '../consts/theme';
import { shortAddress } from '../utils/shortAddress';

type HomeViewProps = {
  /** undefined = still loading (renders '—', matching VaultBalanceCard's
   * isPending state). */
  balanceUsd: number | undefined;
  vaultAddress: string;
  onDeposit: () => void;
  onWithdraw: () => void;
  onOpenAccount: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
};

export function HomeView({
  balanceUsd,
  vaultAddress,
  onDeposit,
  onWithdraw,
  onOpenAccount,
  onRefresh,
  isRefreshing,
}: HomeViewProps) {
  const [justCopied, setJustCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Matches FlowStatusView.tsx's CopyRow, which implements the same
  // "Copied!" transient-flag pattern and clears its timeout on unmount —
  // without this, navigating away within the 1500ms window still fires
  // setJustCopied on an unmounted component (harmless in React 18, but an
  // avoidable inconsistency between two copies of the same pattern).
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Screen>
      <Header
        title="Flow Vault"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Account"
            hitSlop={8}
            onPress={onOpenAccount}
          >
            <PersonIcon color={colors.foreground} />
          </Pressable>
        }
      />

      <View style={styles.shadowWrapper}>
        <View style={styles.card}>
          <LinearGradient
            colors={[colors.vaultGradientStart, colors.vaultGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.eyebrow}>Vault</Text>

              <Pressable
                accessibilityLabel="Refresh balance"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.refreshButton,
                  pressed && styles.overlayPressed,
                ]}
                disabled={isRefreshing}
                onPress={onRefresh}
              >
                <RefreshIcon color={colors.onAccent} />
              </Pressable>
            </View>

            {balanceUsd === undefined ? (
              <Skeleton
                width={140}
                height={40}
                borderRadius={radii.sm}
                style={styles.balanceSkeleton}
              />
            ) : (
              <Text style={styles.balance}>{`$${balanceUsd.toFixed(2)}`}</Text>
            )}
            <Text style={styles.balanceHint}>USDC · Base</Text>

            <Pressable
              hitSlop={8}
              style={({ pressed }) => [
                styles.addressChip,
                pressed && styles.overlayPressed,
              ]}
              onPress={() => {
                Clipboard.setString(vaultAddress);
                setJustCopied(true);
                if (copyTimeoutRef.current) {
                  clearTimeout(copyTimeoutRef.current);
                }
                copyTimeoutRef.current = setTimeout(
                  () => setJustCopied(false),
                  1500,
                );
              }}
            >
              <Text style={styles.addressValue}>
                {shortAddress(vaultAddress)}
              </Text>
              <Text style={styles.addressAction}>
                {justCopied ? 'Copied!' : 'Copy'}
              </Text>
            </Pressable>

            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.overlayPressed,
                ]}
                onPress={onDeposit}
              >
                <DepositIcon color={colors.onAccent} />
                <Text style={styles.actionLabel}>Deposit</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.overlayPressed,
                ]}
                onPress={onWithdraw}
              >
                <WithdrawIcon color={colors.onAccent} />
                <Text style={styles.actionLabel}>Withdraw</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    borderRadius: radii.lg,
    // Lifts the card off the page background. Must NOT also have
    // overflow: 'hidden' (see `card` below) or the shadow disappears.
    shadowColor: colors.vaultGradientEnd,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.onVaultMuted,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.onVaultOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balance: {
    ...typography.displayLarge,
    color: colors.onAccent,
    marginTop: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  balanceSkeleton: {
    marginTop: spacing.md,
    backgroundColor: colors.onVaultOverlay,
  },
  balanceHint: {
    fontSize: 13,
    color: colors.onVaultMuted,
    marginTop: spacing.xs,
  },
  addressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.onVaultOverlay,
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  addressValue: {
    ...typography.label,
    color: colors.onAccent,
  },
  addressAction: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onVaultMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.onVaultOverlay,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  actionLabel: {
    ...typography.bodyMedium,
    color: colors.onAccent,
  },
  overlayPressed: {
    backgroundColor: colors.onVaultOverlayPressed,
  },
});
