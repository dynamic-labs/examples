import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { useReactiveClient } from "@dynamic-labs/react-hooks";

import { dynamicClient } from "@/lib/dynamic";

interface BalanceSectionProps {
  selectedNetworkId?: number | string | null;
}

const BalanceSection = forwardRef<
  { refresh: () => Promise<void> },
  BalanceSectionProps
>(({ selectedNetworkId }, ref) => {
  const client = useReactiveClient(dynamicClient);
  const [balance, setBalance] = useState(0);

  const fetchBalance = useCallback(async () => {
    const wallet = client.wallets.primary;
    if (!wallet) return;

    try {
      const balance = await client.wallets.getBalance({ wallet });
      setBalance(parseFloat(balance.balance));
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(0);
    }
  }, [client.wallets]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, selectedNetworkId]);

  // Expose refresh method to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchBalance,
  }));

  const formatBalance = (value: number) => {
    return `${value.toFixed(2)}`;
  };

  return (
    <View style={styles.balanceSection}>
      <Text style={styles.balanceLabel}>Total balance</Text>
      <Text style={styles.balanceAmount}>{formatBalance(balance)}</Text>
    </View>
  );
});

BalanceSection.displayName = "BalanceSection";

export default BalanceSection;

const styles = StyleSheet.create({
  balanceSection: {
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#8a8a8a",
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: "700",
    color: "#fff",
  },
});
