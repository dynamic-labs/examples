import { useApiClient } from "../lib/apiClient";

import { CreateOnrampOrderParams, OnrampOrderResponse } from "../types";

/**
 * Coinbase Onramp Hook
 *
 * Provides functionality for creating cryptocurrency purchase orders
 * via Coinbase Onramp API through your backend proxy.
 *
 * This hook abstracts the complexity of:
 * - Order creation with proper parameters
 * - Payment method configuration (Apple Pay)
 * - Backend API communication
 * - Error handling and logging
 *
 * @returns Object with createOrder function
 *
 * @example
 * const { createOrder } = useCoinbaseOnramp();
 *
 * const order = await createOrder({
 *   destinationAddress: walletAddress,
 *   destinationNetwork: 'base',
 *   paymentCurrency: 'USD',
 *   paymentAmount: '100',
 *   purchaseCurrency: 'USDC',
 *   purchaseAmount: '100',
 *   agreementAcceptedAt: new Date().toISOString(),
 *   isQuote: false,
 *   isSandbox: __DEV__
 * });
 */
export function useCoinbaseOnramp() {
  const apiClient = useApiClient();

  /**
   * Create an onramp order and get the Apple Pay payment URL
   *
   * This function:
   * 1. Sends order parameters to backend API
   * 2. Backend creates order with Coinbase
   * 3. Returns order details and Apple Pay URL
   * 4. URL is loaded in WebView for payment completion
   *
   * @param params - Order creation parameters
   * @returns Order response with payment URL and order details
   * @throws Error if order creation fails
   */
  const createOrder = async (
    params: CreateOnrampOrderParams
  ): Promise<OnrampOrderResponse> => {
    try {
      console.info("[useCoinbaseOnramp]: Creating onramp order");

      // Send order data to our custom server (which handles Coinbase API)
      const response = await apiClient.post<{ data: OnrampOrderResponse }>(
        "/coinbase/onramp",
        { ...params, paymentMethod: "GUEST_CHECKOUT_APPLE_PAY" }
      );

      console.info("[useCoinbaseOnramp]: Successfully created onramp order");
      return response.data;
    } catch (error) {
      console.error(
        "[useCoinbaseOnramp]: Failed to create Coinbase order:",
        error
      );
      if (error instanceof Error) throw error;
      throw new Error("Failed to create Coinbase order");
    }
  };

  return {
    createOrder,
  };
}
