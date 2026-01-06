/**
 * Types for Checkout.com Flow integration
 */

export interface CreatePaymentSessionParams {
  amount: number; // Amount in dollars
  currency?: string; // Currency code (default: USD)
  reference?: string; // Order reference
  customerEmail: string;
  customerName?: string;
  walletAddress?: string;
}

export interface PaymentSessionResponse extends Record<string, unknown> {
  id: string;
  payment_session_token: string;
  payment_session_secret?: string;
}

export interface PaymentResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reference?: string;
}
