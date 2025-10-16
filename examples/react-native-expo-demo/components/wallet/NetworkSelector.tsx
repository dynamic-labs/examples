import { useReactiveClient } from "@dynamic-labs/react-hooks";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

import { dynamicClient } from "@/lib/dynamic";
import NetworkModal from "./NetworkModal";

interface NetworkSelectorProps {
  onNetworkChange?: (networkId: number | string) => void;
}

const DEFAULT_NETWORK = {
  name: "Ethereum",
  networkId: 1,
  icon: "https://app.dynamic.xyz/assets/networks/eth.svg",
};

export default function NetworkSelector({
  onNetworkChange,
}: NetworkSelectorProps) {
  const client = useReactiveClient(dynamicClient);

  const [currentNetworkId, setCurrentNetworkId] = useState<
    number | string | null
  >(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const primaryWallet = client.wallets.primary;
  const evmNetworks = client.networks.evm;

  // Map networks to options
  const networkOptions = useMemo(
    () =>
      evmNetworks.map((n) => ({
        name: n.vanityName || n.name,
        networkId: n.networkId,
        icon:
          n.iconUrls?.[0] || "https://app.dynamic.xyz/assets/networks/eth.svg",
      })),
    [evmNetworks]
  );

  // Get current network
  const currentNetwork = useMemo(() => {
    if (!currentNetworkId) return networkOptions[0] || DEFAULT_NETWORK;
    return (
      networkOptions.find((n) => n.networkId === currentNetworkId) ||
      networkOptions[0] ||
      DEFAULT_NETWORK
    );
  }, [currentNetworkId, networkOptions]);

  // Fetch current network from wallet
  const fetchCurrentNetwork = useCallback(async () => {
    if (!primaryWallet) {
      setCurrentNetworkId(null);
      return;
    }

    try {
      const { network } = await client.wallets.getNetwork({
        wallet: primaryWallet,
      });
      console.info("[NetworkSelector] Current network:", network);
      setCurrentNetworkId(network);
      onNetworkChange?.(network);
    } catch (error) {
      console.error("[NetworkSelector] Error getting network:", error);
    }
  }, [primaryWallet, client, onNetworkChange]);

  // Fetch network on mount and when wallet/network changes
  useEffect(() => {
    fetchCurrentNetwork();
    client.networks.on("evmChanged", fetchCurrentNetwork);
    return () => {};
  }, [fetchCurrentNetwork, client]);

  // Switch network
  const handleNetworkSwitch = useCallback(
    async (networkId: number | string) => {
      if (!primaryWallet) {
        Alert.alert("[NetworkSelector] Error", "No wallet connected");
        return;
      }

      try {
        // Optimistically update UI for instant feedback
        setCurrentNetworkId(networkId);
        setShowNetworkModal(false);

        await client.wallets.switchNetwork({
          wallet: primaryWallet,
          chainId: networkId,
        });

        console.info("[NetworkSelector] Network switched to:", networkId);
        onNetworkChange?.(networkId);
      } catch (error) {
        console.error("[NetworkSelector] Error switching network:", error);
        Alert.alert("Error", "Failed to switch network. Please try again.");

        // Revert to actual network on error
        await fetchCurrentNetwork();
      }
    },
    [primaryWallet, client, onNetworkChange, fetchCurrentNetwork]
  );

  const handleOpenModal = useCallback(() => setShowNetworkModal(true), []);
  const handleCloseModal = useCallback(() => setShowNetworkModal(false), []);

  return (
    <>
      <TouchableOpacity
        style={styles.networkSelector}
        onPress={handleOpenModal}
      >
        <Image
          source={currentNetwork.icon}
          style={styles.networkIcon}
          contentFit="contain"
        />
        <Text style={styles.networkText}>{currentNetwork.name}</Text>
        <Ionicons name="chevron-down" size={14} color="#666" />
      </TouchableOpacity>

      <NetworkModal
        visible={showNetworkModal}
        networks={networkOptions}
        currentNetworkId={currentNetworkId}
        onClose={handleCloseModal}
        onSelectNetwork={handleNetworkSwitch}
      />
    </>
  );
}

const styles = StyleSheet.create({
  networkSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  networkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  networkText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "500",
  },
});
