import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface QuickAmountButtonsProps {
  amounts: readonly number[];
  onAmountSelect: (amount: number) => void;
}

export default function QuickAmountButtons({
  amounts,
  onAmountSelect,
}: QuickAmountButtonsProps) {
  return (
    <View style={styles.quickAmounts}>
      {amounts.map((value) => (
        <TouchableOpacity
          key={value}
          style={styles.quickAmountButton}
          onPress={() => onAmountSelect(value)}
        >
          <Text style={styles.quickAmountText}>${value}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  quickAmounts: {
    flexDirection: "row",
    gap: 12,
  },
  quickAmountButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
