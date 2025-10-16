import { useReactiveClient } from "@dynamic-labs/react-hooks";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { dynamicClient } from "@/lib/dynamic";
import { MIN_AMOUNT, QUICK_AMOUNTS } from "@/types";
import { useDepositOrder } from "../../hooks/use-deposit-order";
import AmountInputScreen from "./deposit/AmountInputScreen";
import ApplePayButton from "./deposit/ApplePayButton";
import OrderSummaryScreen from "./deposit/OrderSummaryScreen";
import PhoneVerificationModal from "./deposit/PhoneVerificationModal";

// Configuration: Set to false to bypass phone verification requirement
const REQUIRE_PHONE_VERIFICATION = true;

/**
 * DepositModal - Main modal for cryptocurrency deposits via Coinbase Onramp
 *
 * Features:
 * - Amount input with numeric keypad
 * - Quick amount selection
 * - Order summary with fees and exchange rates
 * - Apple Pay integration via WebView
 * - Real-time transaction status updates
 */
interface DepositModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DepositModal({ visible, onClose }: DepositModalProps) {
  const client = useReactiveClient(dynamicClient);
  const [amount, setAmount] = useState("");
  // Note: Currently hardcoded to USDC on Base network
  const selectedToken = "USDC";
  const paymentMethod = "Apple Pay";
  const insets = useSafeAreaInsets();

  const {
    loading,
    orderDetails,
    paymentUrl,
    transactionStatus,
    applePayPressed,
    handleCreateOrder,
    handleWebViewMessage,
    resetState,
    setPaymentUrl,
    setOrderDetails,
  } = useDepositOrder();

  // Check if user can proceed with deposit (phone verified or not required)
  const hasVerifiedPhone = useMemo(() => {
    if (!REQUIRE_PHONE_VERIFICATION) return true;
    const credentials =
      client.auth.authenticatedUser?.verifiedCredentials || [];
    return credentials.some((c) => c.format === "phoneNumber");
  }, [client.auth.authenticatedUser?.verifiedCredentials]);

  // Check if amount is valid
  const isAmountValid = amount !== "" && parseFloat(amount) >= MIN_AMOUNT;
  const isApplePaySupported = Platform.OS === "ios";

  const handleInitiatePurchase = async () => {
    if (!isApplePaySupported) {
      Alert.alert(
        "Not Supported",
        "Apple Pay is only available on iOS devices"
      );
      return;
    }
    await handleCreateOrder(amount);
  };

  const handleBack = () => {
    setPaymentUrl(null);
    setOrderDetails(null);
  };

  const handleMessage = (event: any) => {
    handleWebViewMessage(event, selectedToken, onClose);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) resetState();
  }, [visible, resetState]);

  return (
    <>
      {/* Phone Verification Modal - Only show if required and not verified */}
      <PhoneVerificationModal
        visible={visible && !hasVerifiedPhone}
        onClose={onClose}
      />

      {/* Deposit Modal - Only show if user can proceed */}
      <Modal
        visible={visible && hasVerifiedPhone}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
        presentationStyle="overFullScreen"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.header}>
              {paymentUrl ? (
                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.closeButton}
                >
                  <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
              ) : (
                <View style={styles.headerSpacer} />
              )}
              <Text style={styles.title}>Deposit</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Main Content */}
            {paymentUrl ? (
              <>
                <OrderSummaryScreen
                  amount={amount}
                  selectedToken={selectedToken}
                  estimatedTokenAmount={orderDetails?.purchaseAmount || ""}
                  paymentMethod={paymentMethod}
                  orderDetails={orderDetails}
                />

                {/* Apple Pay Button - Fixed at bottom */}
                <View
                  style={[
                    styles.buttonContainer,
                    { paddingBottom: insets.bottom },
                  ]}
                >
                  <ApplePayButton
                    paymentUrl={paymentUrl}
                    isProcessing={
                      transactionStatus === "processing" || applePayPressed
                    }
                    onMessage={handleMessage}
                  />
                </View>
              </>
            ) : (
              <>
                <AmountInputScreen
                  amount={amount}
                  onAmountChange={setAmount}
                  quickAmounts={QUICK_AMOUNTS}
                />

                {/* Buy Button - Fixed at bottom */}
                <View
                  style={[
                    styles.buttonContainer,
                    { paddingBottom: insets.bottom },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.buyButton,
                      (!isApplePaySupported || loading || !isAmountValid) &&
                        styles.buyButtonDisabled,
                    ]}
                    onPress={handleInitiatePurchase}
                    disabled={!isApplePaySupported || loading || !isAmountValid}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buyButtonText}>Continue</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "75%",
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    flexShrink: 0,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    flexShrink: 0,
  },
  buyButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 16,
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});
