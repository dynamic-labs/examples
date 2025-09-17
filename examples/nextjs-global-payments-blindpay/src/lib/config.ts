// Configuration constants for the application
import { SUPPORTED_CURRENCIES } from "@/types";

export const config = {
  // API Configuration
  blindpay: {
    apiUrl: "https://api.blindpay.com/v1",
    instanceId: process.env.BLINDPAY_INSTANCE_ID!,
    apiKey: process.env.BLINDPAY_API_KEY!,
    kycUrl:
      "https://app.blindpay.com/e/receivers/invite?instanceId=in_sZgM6Bl4Ma9Q&type=individual&kyc_type=standard&token=506b40b087f091cb63a015056d240688211e00cbd117d694cbae0e59caf8f4a5",
  },

  // Dynamic Wallet Configuration
  dynamic: {
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
    apiToken: process.env.DYNAMIC_API_TOKEN!,
  },

  // Contract Addresses
  contracts: {
    usdb: "0x4D423D2cfB373862B8E12843B6175752dc75f795" as `0x${string}`,
  },

  // Defaults
  blindpayDefaults: {
    network: "base_sepolia",
    currencyType: "sender" as const,
    coverFees: false,
    paymentMethod: "ach" as const,
    stablecoinToken: "USDB" as const,
    fiatCurrency: "USD" as const,
  },

  // Supported currencies according to API specification
  currencies: {
    stablecoins: ["USDC", "USDT", "USDB"] as const,
    fiat: ["USD", "BRL", "MXN", "COP", "ARS"] as const,
    all: SUPPORTED_CURRENCIES,
  },
} as const;
