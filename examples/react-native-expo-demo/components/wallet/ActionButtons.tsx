import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ActionButtonsProps {
  onDeposit?: () => void;
  onSend?: () => void;
}

export default function ActionButtons({
  onDeposit,
  onSend,
}: ActionButtonsProps) {
  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.primaryButton} onPress={onDeposit}>
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.primaryButtonText}>Deposit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.primaryButton} onPress={onSend}>
        <Ionicons name="arrow-up" size={20} color="white" />
        <Text style={styles.primaryButtonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#5B8DEF",
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
