import { StyleSheet, Text, View } from "react-native";

import { CoinbaseOrder } from "@/hooks/types";

interface OrderSummaryScreenProps {
  amount: string;
  selectedToken: string;
  estimatedTokenAmount: string;
  paymentMethod: string;
  orderDetails: CoinbaseOrder | null;
}

export default function OrderSummaryScreen({
  amount,
  selectedToken,
  estimatedTokenAmount,
  paymentMethod,
  orderDetails,
}: OrderSummaryScreenProps) {
  return (
    <View style={styles.confirmationContainer}>
      {/* Order Summary Title */}
      <Text style={styles.sectionTitle}>Order Summary</Text>

      {/* Purchase Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment Amount</Text>
          <Text style={styles.summaryValue}>
            {orderDetails?.paymentTotal
              ? `$${parseFloat(orderDetails.paymentTotal).toFixed(2)}`
              : `$${amount}`}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>You&apos;ll receive</Text>
          <Text style={styles.summaryValue}>
            {orderDetails?.purchaseAmount
              ? `${parseFloat(orderDetails.purchaseAmount).toFixed(6)} ${
                  orderDetails.purchaseCurrency
                }`
              : `${estimatedTokenAmount} ${selectedToken}`}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Exchange Rate</Text>
          <Text style={styles.summaryValue}>
            {orderDetails?.exchangeRate
              ? `1 ${orderDetails.purchaseCurrency} = $${parseFloat(
                  orderDetails.exchangeRate
                ).toFixed(2)}`
              : "—"}
          </Text>
        </View>
        {orderDetails?.fees && orderDetails.fees.length > 0 && (
          <>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fees</Text>
              <Text style={styles.summaryValue}>
                $
                {orderDetails.fees
                  .reduce((sum, fee) => sum + parseFloat(fee.amount), 0)
                  .toFixed(2)}
              </Text>
            </View>
          </>
        )}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Network</Text>
          <Text style={styles.summaryValue}>
            {orderDetails?.destinationNetwork
              ? orderDetails.destinationNetwork.charAt(0).toUpperCase() +
                orderDetails.destinationNetwork.slice(1)
              : "Base"}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment method</Text>
          <Text style={styles.summaryValue}>{paymentMethod}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  confirmationContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: "#0f0f0f",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#8a8a8a",
    flex: 1,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    textAlign: "right",
    flexShrink: 1,
    marginLeft: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#2a2a2a",
  },
});
