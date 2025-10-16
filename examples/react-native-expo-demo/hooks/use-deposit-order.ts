import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { dynamicClient } from "@/lib/dynamic";
import {
  CoinbaseErrorCodes,
  type CoinbaseOrder,
  type OnrampEvent,
  type TransactionStatus,
  type WebViewMessageEvent,
} from "../types";
import { useCoinbaseOnramp } from "./use-coinbase-onramp";

/**
 * Deposit Order Management Hook
 *
 * Orchestrates the complete deposit/purchase flow for buying cryptocurrency
 * via Coinbase Onramp with Apple Pay. This hook manages:
 *
 * - Order creation lifecycle
 * - Transaction state machine
 * - WebView message handling for Apple Pay events
 * - Error handling with user-friendly messages
 * - State cleanup and reset
 *
 * The hook follows this flow:
 * 1. User initiates purchase → handleCreateOrder()
 * 2. Order created → paymentUrl set
 * 3. Apple Pay WebView shown
 * 4. User completes payment → WebView sends events
 * 5. handleWebViewMessage() processes events
 * 6. Transaction completes → success/error state
 * 7. Modal closes → resetState()
 *
 * @returns Object with deposit state and handler functions
 *
 * @example
 * const {
 *   loading,
 *   paymentUrl,
 *   transactionStatus,
 *   handleCreateOrder,
 *   handleWebViewMessage,
 *   resetState
 * } = useDepositOrder();
 *
 * // In component:
 * await handleCreateOrder('100'); // Create $100 order
 *
 * // In WebView:
 * <WebView
 *   source={{ uri: paymentUrl }}
 *   onMessage={handleWebViewMessage}
 * />
 */
export function useDepositOrder() {
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<CoinbaseOrder | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>("idle");
  const [applePayPressed, setApplePayPressed] = useState(false);

  const dynamicPrimaryWallet = dynamicClient.wallets.primary;
  const { createOrder } = useCoinbaseOnramp();

  const getErrorMessage = useCallback(
    (message: OnrampEvent, fallback: string) => {
      return (
        CoinbaseErrorCodes[
          message.data?.errorCode as keyof typeof CoinbaseErrorCodes
        ] ||
        message.data?.errorMessage ||
        fallback
      );
    },
    []
  );

  const handleError = useCallback(
    (message: OnrampEvent, title: string, fallback: string) => {
      setTransactionStatus("error");
      setApplePayPressed(false);
      Alert.alert(title, getErrorMessage(message, fallback));
      setPaymentUrl(null);
    },
    [getErrorMessage]
  );

  const handleCreateOrder = async (amount: string) => {
    if (!dynamicPrimaryWallet) {
      Alert.alert("Error", "No wallet connected");
      return;
    }

    try {
      setLoading(true);

      const order = await createOrder({
        destinationAddress: dynamicPrimaryWallet.address,
        destinationNetwork: "base",
        paymentCurrency: "USD",
        paymentAmount: amount,
        purchaseCurrency: "USDC",
        purchaseAmount: amount,
        agreementAcceptedAt: new Date().toISOString(),
        isQuote: false,
        isSandbox: __DEV__,
      });

      setOrderId(order.id);
      setPaymentUrl(order.paymentUrl);
      setOrderDetails(order.orderDetails || null);
    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      Alert.alert(
        "Error Creating Order",
        `${errorMessage}\n\nPlease check:\n• API credentials are correct\n• You have access to Coinbase Onramp API\n• API endpoint is correct for your region`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewMessage = useCallback(
    (
      event: WebViewMessageEvent,
      selectedToken: string,
      onClose: () => void
    ) => {
      try {
        const message: OnrampEvent = JSON.parse(event.nativeEvent.data);
        console.info("[useDepositOrder]: Coinbase event", message.eventName);

        switch (message.eventName) {
          case "onramp_api.apple_pay_button_pressed":
            setApplePayPressed(true);
            break;

          case "onramp_api.load_pending":
            setTransactionStatus("processing");
            break;

          case "onramp_api.load_success":
            setTransactionStatus("idle");
            setApplePayPressed(false);
            break;

          case "onramp_api.load_error":
            handleError(message, "Error", "Failed to load Apple Pay button");
            break;

          case "onramp_api.commit_success":
            setTransactionStatus("processing");
            setApplePayPressed(false);
            Alert.alert(
              "Transaction Started",
              "Your purchase is being processed. This may take a few moments."
            );
            break;

          case "onramp_api.commit_error":
            handleError(
              message,
              "Transaction Failed",
              "Failed to process payment"
            );
            break;

          case "onramp_api.cancel":
            setTransactionStatus("idle");
            setApplePayPressed(false);
            setPaymentUrl(null);
            break;

          case "onramp_api.polling_success":
            setTransactionStatus("success");
            setApplePayPressed(false);
            Alert.alert(
              "Success!",
              `Your ${selectedToken} has been sent to your wallet.`,
              [{ text: "Done", onPress: onClose }]
            );
            break;

          case "onramp_api.polling_error":
            handleError(
              message,
              "Transaction Error",
              "An error occurred while processing your transaction"
            );
            break;
        }
      } catch (error) {
        console.error(
          "[useDepositOrder]: Error parsing WebView message:",
          error
        );
      }
    },
    [handleError]
  );

  const resetState = useCallback(() => {
    setPaymentUrl(null);
    setTransactionStatus("idle");
    setOrderId(null);
    setOrderDetails(null);
    setApplePayPressed(false);
  }, []);

  return {
    loading,
    orderId,
    orderDetails,
    paymentUrl,
    transactionStatus,
    applePayPressed,
    handleCreateOrder,
    handleWebViewMessage,
    resetState,
    setPaymentUrl,
    setOrderDetails,
  };
}
