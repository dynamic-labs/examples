// ============================================================================
// Coinbase Onramp Types
// ============================================================================

/**
 * Parameters for creating a Coinbase Onramp order
 */
export interface CreateOnrampOrderParams {
  /** ISO timestamp when user agreed to terms */
  agreementAcceptedAt: string;
  /** Wallet address to receive crypto */
  destinationAddress: string;
  /** Blockchain network (e.g., 'base', 'ethereum') */
  destinationNetwork: string;
  /** Fiat currency code (e.g., 'USD') */
  paymentCurrency: string;
  /** Amount in fiat currency as string */
  paymentAmount: string;
  /** Cryptocurrency to purchase (e.g., 'USDC', 'ETH') */
  purchaseCurrency: string;
  /** Expected crypto amount as string */
  purchaseAmount: string;
  /** Whether this is a quote (false for actual orders) */
  isQuote: boolean;
  /** Use sandbox mode for testing (no real money) */
  isSandbox?: boolean;
}

/**
 * Detailed order information from Coinbase
 */
export interface CoinbaseOrder {
  /** Unique order ID */
  orderId: string;
  /** When the order was created */
  createdAt: string;
  /** When the order was last updated */
  updatedAt: string;
  /** Current order status */
  status: string;
  /** Destination wallet address */
  destinationAddress: string;
  /** Blockchain network for delivery */
  destinationNetwork: string;
  /** Fiat currency used for payment */
  paymentCurrency: string;
  /** Payment method (e.g., 'GUEST_CHECKOUT_APPLE_PAY') */
  paymentMethod: string;
  /** Subtotal before fees */
  paymentSubtotal: string;
  /** Total including all fees */
  paymentTotal: string;
  /** Amount of crypto to be purchased */
  purchaseAmount: string;
  /** Cryptocurrency being purchased */
  purchaseCurrency: string;
  /** Exchange rate used */
  exchangeRate: string;
  /** Array of fees applied to the order */
  fees: {
    /** Fee type (e.g., 'network_fee', 'service_fee') */
    type: string;
    /** Fee amount */
    amount: string;
    /** Currency of the fee */
    currency: string;
  }[];
}

/**
 * Response from creating an onramp order
 */
export interface OnrampOrderResponse {
  /** Unique order identifier */
  id: string;
  /** URL to render in WebView for Apple Pay checkout */
  paymentUrl: string;
  /** Current order status */
  status: string;
  /** ISO timestamp when order was created */
  createdAt: string;
  /** Full order details from Coinbase (if available) */
  orderDetails?: CoinbaseOrder;
}

// ============================================================================
// Coinbase Event Types
// ============================================================================

/**
 * All possible event names sent from Coinbase WebView
 */
export type OnrampEventName =
  | "onramp_api.apple_pay_button_pressed"
  | "onramp_api.load_pending"
  | "onramp_api.load_success"
  | "onramp_api.load_error"
  | "onramp_api.commit_success"
  | "onramp_api.commit_error"
  | "onramp_api.cancel"
  | "onramp_api.polling_start"
  | "onramp_api.polling_success"
  | "onramp_api.polling_error";

/**
 * Event structure sent from Coinbase WebView
 */
export interface OnrampEvent {
  /** Name of the event */
  eventName: OnrampEventName;
  /** Optional event data (usually present for error events) */
  data?: {
    /** Error code for error events */
    errorCode?: string;
    /** Human-readable error message */
    errorMessage?: string;
  };
}

/**
 * Mapping of Coinbase error codes to user-friendly messages
 */
export const CoinbaseErrorCodes = {
  // Load errors
  ERROR_CODE_INIT: "Payment link expired",
  ERROR_CODE_GUEST_APPLE_PAY_NOT_SUPPORTED:
    "Apple Pay is not supported on this device",
  ERROR_CODE_GUEST_APPLE_PAY_NOT_SETUP:
    "Please set up Apple Pay on your device and try again",

  // Commit errors
  ERROR_CODE_GUEST_CARD_SOFT_DECLINED:
    "Transaction declined. Please contact your bank or try a different card",
  ERROR_CODE_GUEST_INVALID_CARD: "Invalid card or billing address",
  ERROR_CODE_GUEST_CARD_INSUFFICIENT_BALANCE: "Insufficient card balance",
  ERROR_CODE_GUEST_CARD_HARD_DECLINED: "Transaction declined by your bank",
  ERROR_CODE_GUEST_CARD_RISK_DECLINED:
    "Transaction declined for security reasons",
  ERROR_CODE_GUEST_REGION_MISMATCH: "Your region is not supported",
  ERROR_CODE_GUEST_PERMISSION_DENIED: "Access denied",
  ERROR_CODE_GUEST_CARD_PREPAID_DECLINED: "Prepaid cards are not supported",
  ERROR_CODE_GUEST_TRANSACTION_LIMIT: "Weekly transaction limit exceeded",
  ERROR_CODE_GUEST_TRANSACTION_COUNT: "Transaction count limit exceeded",

  // Polling errors
  ERROR_CODE_GUEST_TRANSACTION_BUY_FAILED: "Unable to complete crypto purchase",
  ERROR_CODE_GUEST_TRANSACTION_SEND_FAILED:
    "Unable to send funds. Your card will be refunded",
  ERROR_CODE_GUEST_TRANSACTION_TRANSACTION_FAILED:
    "An error occurred. Our team has been notified",
  ERROR_CODE_GUEST_TRANSACTION_AVS_VALIDATION_FAILED:
    "Unable to verify billing address. Please check with your bank",
} as const;

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Possible states for a crypto purchase transaction
 */
export type TransactionStatus =
  | "idle" // No transaction in progress
  | "processing" // Transaction being processed
  | "success" // Transaction completed successfully
  | "error"; // Transaction failed

// ============================================================================
// Wallet Types
// ============================================================================

/**
 * Token display information
 */
export interface Token {
  /** Token symbol (e.g., 'ETH', 'USDC') */
  symbol: string;
  /** Full token name */
  name: string;
  /** Token balance as string */
  balance: string;
  /** USD value as formatted string (e.g., '$100.00') */
  value: string;
  /** Icon/emoji for token display */
  icon: string;
  /** Optional price change percentage */
  change?: string;
}

/**
 * Network information for display
 */
export interface NetworkInfo {
  /** Network display name */
  name: string;
  /** Chain ID (number or string) */
  networkId: number | string;
  /** URL to network icon/logo */
  icon: string;
}

// ============================================================================
// Component Prop Types
// ============================================================================

/**
 * Props for components that handle WebView messages
 */
export interface WebViewMessageEvent {
  nativeEvent: {
    /** Stringified JSON data from WebView */
    data: string;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Quick amount button values in USD
 */
export const QUICK_AMOUNTS = [25, 100, 500] as const;

/**
 * Minimum purchase amount in USD
 */
export const MIN_AMOUNT = 2 as const;
