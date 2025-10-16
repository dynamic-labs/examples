# React Native Expo - Dynamic Labs + Coinbase Onramp

This example demonstrates how to integrate **Dynamic Labs** embedded wallets with **Coinbase Onramp** in a React Native mobile app, including purchasing stablecoins with Apple Pay.

## What This Example Shows

- Email OTP authentication with Dynamic Labs
- Automatic embedded wallet creation
- Fiat-to-crypto purchases via Coinbase Onramp (Apple Pay)
- Multi-chain token balance display (Ethereum, Base)
- Network switching between EVM chains
- Phone verification before deposits

## Architecture

```
┌─────────────────┐
│   Mobile App    │
│  (React Native) │
└────────┬────────┘
         │
         ├────────────────┐
         │                │
    ┌────▼─────┐    ┌─────▼──────┐
    │ Dynamic  │    │  Backend   │
    │   Labs   │    │    API     │
    └──────────┘    └─────┬──────┘
                          │
                    ┌─────▼──────┐
                    │  Coinbase  │
                    │   Onramp   │
                    └────────────┘
```

The app communicates with Dynamic Labs directly for authentication, while crypto purchases are routed through your backend API for secure Coinbase integration.

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio
- [Dynamic Labs account](https://app.dynamic.xyz/) (free)
- [Coinbase Cloud account](https://cloud.coinbase.com/) with Onramp API access
- A backend server to proxy Coinbase API calls (see [Backend Setup](#backend-setup))

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the `.example.env` file and configure your credentials:

```bash
cp .example.env .env
```

Edit `.env`:

```bash
# Get from https://app.dynamic.xyz/dashboard/developer
EXPO_PUBLIC_ENVIRONMENT_ID=your_dynamic_environment_id

# Your backend API URL (must be accessible via HTTPS)
EXPO_PUBLIC_API_BASE_URL=https://your-backend.com
```

### 3. Configure Dynamic Labs

1. Go to your [Dynamic dashboard](https://app.dynamic.xyz/)
2. Enable **Email OTP** authentication
3. Enable **Embedded Wallets**
4. Add **Ethereum** and **Base** networks

### 4. Run the App

```bash
# Start Metro bundler
npm start

# Run on specific platform
npm run ios       # iOS Simulator
npm run android   # Android Emulator
```

## Backend Setup

This example requires a backend server to securely handle Coinbase Onramp API calls. Your backend must:

1. Verify Dynamic JWT tokens
2. Extract user email and phone number
3. Proxy requests to Coinbase Onramp API
4. Add required fields (`partner_user_ref`, `email`, `phone_number`)

See [docs/BACKEND_API.md](./docs/BACKEND_API.md) for complete specification and example implementations (Next.js and Express).

## Key Files

| File                                 | Description                                                               |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `lib/dynamic.ts`                     | Dynamic SDK configuration with React Native, Viem, and ZeroDev extensions |
| `lib/apiClient.ts`                   | Authenticated API client with JWT injection                               |
| `hooks/use-coinbase-onramp.ts`       | Hook for creating Coinbase Onramp orders                                  |
| `hooks/use-deposit-order.ts`         | Deposit flow orchestration and WebView event handling                     |
| `app/login.tsx`                      | Email OTP authentication screen                                           |
| `app/(tabs)/index.tsx`               | Main wallet screen with balance and deposit                               |
| `components/wallet/DepositModal.tsx` | Full deposit flow modal with Apple Pay                                    |

## How It Works

### Authentication Flow

1. User enters email → Dynamic sends OTP
2. User enters 6-digit code → Dynamic creates embedded wallet
3. App redirects to wallet screen

### Deposit Flow

1. User taps "Deposit" → Phone verification (if not already verified)
2. User enters deposit amount → Creates order via backend
3. Backend adds user info (email, phone) → Calls Coinbase API
4. Coinbase returns Apple Pay URL → Loaded in WebView
5. User completes Apple Pay → Crypto sent to wallet

### Key Integration Points

**Dynamic SDK Configuration** (`lib/dynamic.ts`):

```typescript
export const dynamicClient = createClient({
  environmentId,
  appLogoUrl: "https://demo.dynamic.xyz/favicon-32x32.png",
  appName: "Dynamic Demo",
})
  .extend(ReactNativeExtension()) // React Native support
  .extend(ViemExtension()) // Ethereum interactions
  .extend(ZeroDevExtension()); // Account abstraction
```

**API Client with Auth** (`lib/apiClient.ts`):

- Automatically injects Dynamic JWT tokens
- Adds Environment ID header
- Type-safe request methods

**Coinbase Integration** (`hooks/use-coinbase-onramp.ts`):

- Creates onramp orders via backend
- Returns payment URL for Apple Pay WebView
- Handles order status updates

## Troubleshooting

| Issue                              | Solution                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| App won't start                    | Run `expo start -c` to clear cache                                                  |
| Environment variables not updating | Restart Expo dev server after changing `.env`                                       |
| Authentication failing             | Check Environment ID and ensure Email OTP is enabled in Dynamic dashboard           |
| Coinbase orders failing            | Verify backend is running and accessible, check API credentials                     |
| Apple Pay not working              | Only works on iOS devices/simulator (not Expo Go). Verify Merchant ID in `app.json` |

## Testing & Deployment

### Testing with Sandbox Mode

- Set `isSandbox: true` in your backend during development
- No real money charged in sandbox mode
- Use [Apple's test cards](https://developer.apple.com/apple-pay/sandbox-testing/)

### Production Build

```bash
npm install -g eas-cli
eas build:configure
eas build --platform ios    # or --platform android
```

**Before production:**

- Update bundle IDs and Merchant ID in `app.json`
- Configure production backend URL
- Disable sandbox mode
- Test on physical devices

## Security

- ✅ Backend verifies Dynamic JWT tokens
- ✅ Coinbase API keys never exposed to mobile app
- ✅ All API communication over HTTPS
- ✅ Rate limiting on backend endpoints

## Learn More

- [Dynamic Labs Documentation](https://docs.dynamic.xyz/)
- [Coinbase Onramp API](https://docs.cloud.coinbase.com/onramp/docs)
- [Backend API Specification](./docs/BACKEND_API.md)
- [Dynamic Labs Examples](https://github.com/dynamic-labs/examples)
- [Dynamic Slack](https://www.dynamic.xyz/join-slack)
