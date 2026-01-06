"use client";

import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import type {
  CreatePaymentSessionParams,
  PaymentSessionResponse,
} from "@/lib/types/checkout";

/**
 * Checkout.com Hook
 *
 * Provides functionality for creating payment sessions
 * via Checkout.com Flow API.
 *
 * @returns Object with createPaymentSession function
 */
export function useCheckout() {
  /**
   * Create a payment session for Checkout.com Flow
   *
   * @param params - Payment session creation parameters
   * @returns Payment session response with token and secret
   * @throws Error if payment session creation fails
   */
  const createPaymentSession = async (
    params: CreatePaymentSessionParams
  ): Promise<PaymentSessionResponse> => {
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error("User is not authenticated. Please log in first.");
      }

      const response = await fetch("/api/checkout/payment-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          `Failed to create payment session: ${response.status} ${
            response.statusText
          }. ${errorData.error || ""}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[useCheckout]: Failed to create payment session:", error);
      if (error instanceof Error) throw error;
      throw new Error("Failed to create payment session");
    }
  };

  return {
    createPaymentSession,
  };
}
