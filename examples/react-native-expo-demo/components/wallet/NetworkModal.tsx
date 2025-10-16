import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NetworkOption {
  name: string;
  networkId: number | string;
  icon: string;
}

interface NetworkModalProps {
  visible: boolean;
  networks: NetworkOption[];
  currentNetworkId: number | string | null;
  onClose: () => void;
  onSelectNetwork: (networkId: number | string) => void;
}

export default function NetworkModal({
  visible,
  networks,
  currentNetworkId,
  onClose,
  onSelectNetwork,
}: NetworkModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Network</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.networkList}>
            {networks.map((network) => (
              <TouchableOpacity
                key={network.networkId}
                style={[
                  styles.networkItem,
                  network.networkId === currentNetworkId &&
                    styles.networkItemActive,
                ]}
                onPress={() => onSelectNetwork(network.networkId)}
              >
                <View style={styles.networkItemLeft}>
                  <Image
                    source={network.icon}
                    style={styles.networkItemIcon}
                    contentFit="contain"
                  />
                  <Text style={styles.networkItemText}>{network.name}</Text>
                </View>
                {network.networkId === currentNetworkId && (
                  <Ionicons name="checkmark" size={20} color="#5B8DEF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  networkList: {
    padding: 16,
  },
  networkItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  networkItemActive: {
    backgroundColor: "#5B8DEF20",
    borderWidth: 1,
    borderColor: "#5B8DEF",
  },
  networkItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  networkItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  networkItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
});
