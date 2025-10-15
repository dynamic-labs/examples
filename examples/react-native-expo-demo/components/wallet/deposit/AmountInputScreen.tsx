import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, Text, View } from "react-native";

import LegalNotice from "./LegalNotice";
import NumericKeypad from "./NumericKeypad";
import QuickAmountButtons from "./QuickAmountButtons";

interface AmountInputScreenProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  quickAmounts: readonly number[];
}

export default function AmountInputScreen({
  amount,
  onAmountChange,
  quickAmounts,
}: AmountInputScreenProps) {
  const isApplePaySupported = Platform.OS === "ios";

  const handleNumberPress = (num: string) => {
    onAmountChange(amount + num);
  };

  const handleBackspace = () => {
    onAmountChange(amount.slice(0, -1));
  };

  const handleQuickAmount = (value: number) => {
    onAmountChange(value.toString());
  };

  return (
    <View style={styles.contentContainer}>
      {/* Amount Display */}
      <View style={styles.amountSection}>
        <Text
          style={[
            styles.amountDisplay,
            amount === "" && styles.amountPlaceholder,
          ]}
        >
          ${amount || "33"}
        </Text>

        <QuickAmountButtons
          amounts={quickAmounts}
          onAmountSelect={handleQuickAmount}
        />
      </View>

      {/* Numeric Keypad */}
      <NumericKeypad
        onNumberPress={handleNumberPress}
        onBackspace={handleBackspace}
      />

      {/* iOS Only Notice */}
      {!isApplePaySupported && (
        <View style={styles.warningBanner}>
          <Ionicons name="information-circle" size={20} color="#FFA500" />
          <Text style={styles.warningText}>
            Apple Pay is only available on iOS devices
          </Text>
        </View>
      )}

      <LegalNotice />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
  },
  amountSection: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  amountDisplay: {
    fontSize: 64,
    fontWeight: "300",
    color: "#fff",
    marginBottom: 16,
    letterSpacing: -2,
  },
  amountPlaceholder: {
    opacity: 0.3,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFA50020",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#FFA500",
  },
});
