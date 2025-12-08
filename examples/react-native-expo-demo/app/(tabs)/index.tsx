import { useReactiveClient } from "@dynamic-labs/react-hooks";
import { useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { parseEther } from "viem/utils";
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
  const client = useReactiveClient(dynamicClient);
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

  const client = useReactiveClient(dynamicClient);
  const primaryWallet = client.wallets.primary;
  const walletAddress = primaryWallet?.address || "";

  const _sendTransaction = async () => {
    try {
      console.log("[_sendTransaction] Starting transaction...");

      if (!primaryWallet) {
        console.error("[_sendTransaction] No wallet available");
        throw new Error("Dynamic wallet not available");
      }

      console.log("[_sendTransaction] Wallet found:", {
        address: primaryWallet.address,
        id: primaryWallet.id,
      });

      // Get network from wallet
      const { network: walletNetworkId } = await client.wallets.getNetwork({
        wallet: primaryWallet,
      });
      console.log("[_sendTransaction] Wallet networkId:", { walletNetworkId });

      // Find the network config to get the actual chainId
      const networkConfig = client.networks.evm.find(
        (n) => n.networkId === walletNetworkId
      );
      const chainId = networkConfig?.chainId || walletNetworkId;
      console.log("[_sendTransaction] Using chainId:", {
        chainId,
        networkId: walletNetworkId,
      });

      // Create wallet client using Dynamic's viem extension
      // The wallet client will use the wallet's current chain automatically
      const walletClient = await client.viem?.createWalletClient({
        wallet: primaryWallet,
      });

      if (!walletClient) {
        console.error("[_sendTransaction] Failed to create wallet client");
        throw new Error("Failed to create wallet client");
      }

      // Create public client for the same chain
      const publicClient = client.viem?.createPublicClient({
        chain: { id: chainId } as any,
      });

      // Hardcoded transaction: 0.0001 ETH to walletAddress
      const value = parseEther("0.0001");
      console.log("[_sendTransaction] Sending transaction:", {
        to: walletAddress,
        value: value.toString(),
        valueEth: "0.0001",
        chainId,
      });

      const hash = await walletClient.sendTransaction({
        account: walletAddress as `0x${string}`,
        to: walletAddress as `0x${string}`,
        value,
      });

      console.log("[_sendTransaction] Transaction sent successfully:", {
        hash,
      });

      if (publicClient) {
        console.log("[_sendTransaction] Waiting for transaction receipt...");
        const receipt = await publicClient.getTransactionReceipt({ hash });
        console.log("[_sendTransaction] Transaction receipt:", receipt);
      }

      console.log("[_sendTransaction] Transaction completed:", { hash });
      return hash;
    } catch (error) {
      console.error("[_sendTransaction] Error:", error);
      throw error;
    }
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
          onSend={_sendTransaction}
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
