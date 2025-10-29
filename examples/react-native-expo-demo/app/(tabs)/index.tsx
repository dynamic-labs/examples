import { useReactiveClient } from "@dynamic-labs/react-hooks";
import { useRef, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ActionButtons from "@/components/wallet/ActionButtons";
import BalanceSection from "@/components/wallet/BalanceSection";
import DepositModal from "@/components/wallet/DepositModal";
import NetworkSelector from "@/components/wallet/NetworkSelector";
import TokenList from "@/components/wallet/TokenList";
import WalletHeader from "@/components/wallet/WalletHeader";
import { dynamicClient } from "@/lib/dynamic";

export default function HomeScreen() {
  const client = useReactiveClient(dynamicClient);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState<
    number | string | null
  >(null);
  const balanceSectionRef = useRef<{ refresh: () => Promise<void> }>(null);
  const tokenListRef = useRef<{ refresh: () => Promise<void> }>(null);

  // Get user information from Dynamic client
  const primaryWallet = client.wallets.primary;
  const walletAddress = primaryWallet?.address || "";

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      balanceSectionRef.current?.refresh(),
      tokenListRef.current?.refresh(),
    ]);
    setRefreshing(false);
  };

  const handleNetworkChange = (networkId: number | string) => {
    setSelectedNetworkId(networkId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8a8a8a"
            colors={["#8a8a8a"]}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <WalletHeader walletAddress={walletAddress} />
          <NetworkSelector onNetworkChange={handleNetworkChange} />
        </View>

        {/* Balance Section */}
        <BalanceSection
          ref={balanceSectionRef}
          selectedNetworkId={selectedNetworkId}
        />

        {/* Action Buttons */}
        <ActionButtons
          onDeposit={() => setShowDepositModal(true)}
          onSend={() => Alert.alert("Send", "Send feature coming soon")}
        />

        {/* Tokens Section */}
        <TokenList ref={tokenListRef} selectedNetworkId={selectedNetworkId} />
      </ScrollView>

      {/* Deposit Modal */}
      <DepositModal
        visible={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
});
