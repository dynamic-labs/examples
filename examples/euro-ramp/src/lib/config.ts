export const config = {
  // Dynamic Wallet Configuration
  dynamic: {
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
  },

  // Internal API Configuration (same-origin)
  api: {
    baseUrl: "",
  },

  // Supported countries with focus on Europe
  supportedCountries: {
    europe: [
      "DE",
      "FR",
      "ES",
      "IT",
      "NL",
      "BE",
      "AT",
      "PT",
      "IE",
      "FI",
      "SE",
      "NO",
      "DK",
      "PL",
      "CZ",
      "HU",
      "RO",
      "GR",
      "BG",
      "HR",
      "SK",
      "SI",
      "LT",
      "LV",
      "EE",
      "CY",
      "MT",
      "LU",
    ],
    other: ["US", "GB", "CA", "AU", "NZ", "SG", "JP", "KR", "HK"],
  },

  // Supported payment methods
  paymentMethods: {
    europe: ["SEPA"],
    us: ["ACH", "WIRE"],
    uk: ["FASTER_PAYMENTS"],
    brazil: ["PIX"],
  },
} as const;
