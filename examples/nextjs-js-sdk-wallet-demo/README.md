# Dynamic JS SDK Wallet Demo

A Next.js example demonstrating embedded wallet (WaaS) functionality using the [Dynamic JavaScript SDK](https://www.dynamic.xyz/docs/javascript).

## Features

- **Email OTP Authentication** - Passwordless login via email one-time password
- **Google OAuth** - Social login with Google
- **Embedded Wallets (WaaS)** - Create EVM and Solana wallets tied to user accounts
- **Multi-Network Support** - Switch between enabled networks (Ethereum, Base, Sepolia, etc.)
- **Gas Sponsorship** - ZeroDev integration for sponsored transactions on supported networks
- **Send Transactions** - Transfer native tokens with automatic wallet selection

## Architecture

```
├── app/
│   ├── page.tsx              # Server component entry point
│   ├── globals.css           # Theme variables and global styles
│   └── api/
│       └── webhooks/
│           └── dynamic/
│               └── route.ts  # Webhook endpoint for Dynamic events
├── components/
│   ├── wallet-app.tsx        # Main client component (SDK-dependent logic)
│   ├── screens/              # Full-page screen components
│   │   ├── auth-screen.tsx
│   │   ├── otp-verify-screen.tsx
│   │   ├── dashboard-screen.tsx
│   │   └── send-tx-screen.tsx
│   ├── wallet/               # Wallet-specific components
│   │   ├── wallet-row.tsx
│   │   ├── scrollable-wallet-list.tsx
│   │   ├── create-wallet-buttons.tsx
│   │   └── network-selector.tsx
│   └── ui/                   # Reusable UI primitives
├── hooks/
│   ├── use-auth.ts           # Auth state subscription
│   ├── use-gas-sponsorship.ts # Sponsorship check & wallet selection
│   ├── use-navigation.ts     # Screen routing state machine
│   ├── use-mutations.ts      # React Query mutations
│   └── use-*.ts              # Other data hooks
├── lib/
│   ├── dynamic-client.ts     # SDK singleton with SSR-safe wrappers
│   ├── transactions/         # Chain-specific transaction logic
│   │   ├── send-transaction.ts
│   │   ├── send-evm-transaction.ts
│   │   └── send-solana-transaction.ts
│   └── wallet-utils.ts       # Helper functions
```

## Key Concepts

### 1. SSR-Safe SDK Initialization

The Dynamic client is initialized as a singleton with SSR guards:

```typescript
// lib/dynamic-client.ts
function getClient(): DynamicClient | null {
  if (typeof window === "undefined") return null; // SSR guard

  if (!_client) {
    _client = createDynamicClient({
      environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
    });
    addEvmExtension(_client);
    addSolanaExtension(_client);
    addZerodevExtension(_client);
  }
  return _client;
}
```

### 2. Reactive Auth State

Uses `useSyncExternalStore` to subscribe to Dynamic SDK events:

```typescript
// hooks/use-auth.ts
export function useAuth(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

### 3. Gas Sponsorship & Wallet Selection

The `useGasSponsorship` hook handles both sponsorship checking and wallet selection:

```typescript
// hooks/use-gas-sponsorship.ts
export function useGasSponsorship(
  walletAddress,
  allWalletAccounts,
  networkData,
) {
  // 1. Find ZeroDev and base wallets for this address
  // 2. Switch ZeroDev wallet to target network
  // 3. Call canSponsorTransaction to check availability
  // 4. Return walletToUse (ZeroDev if sponsored, base otherwise)

  return { isSponsored, isLoading, walletToUse, zerodevWallet, baseWallet };
}
```

### 4. Transaction Flow

Transactions use the wallet selected by `useGasSponsorship`:

```typescript
// lib/transactions/send-evm-transaction.ts
export async function sendEvmTransaction({ walletAccount, ... }) {
  // ZeroDev wallet → use kernel client (supports sponsorship)
  if (walletAccount.walletProviderKey.includes("zerodev")) {
    const kernelClient = await createKernelClientForWalletAccount({
      smartWalletAccount: walletAccount,
    });
    return await kernelClient.sendTransaction(tx);
  }

  // Base wallet → use viem wallet client
  const walletClient = await createWalletClientForWalletAccount({ walletAccount });
  return await walletClient.sendTransaction(tx);
}
```

### 5. Network Switching

The `NetworkSelector` switches all wallets for an address to keep them in sync:

```typescript
// components/wallet/network-selector.tsx
await Promise.all(
  walletsForAddress.map((wallet) =>
    switchActiveNetwork({ networkId, walletAccount: wallet }),
  ),
);
```

## Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env.local
   ```

   Set your Dynamic environment ID:

   ```
   NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-environment-id
   ```

3. **Run development server:**
   ```bash
   pnpm dev
   ```

## Dynamic Dashboard Configuration

In your [Dynamic Dashboard](https://app.dynamic.xyz):

1. **Enable Email Authentication** - Settings → Authentication → Email
2. **Enable Google OAuth** - Settings → Authentication → Social → Google
3. **Enable Embedded Wallets** - Settings → Embedded Wallets → Enable for EVM and/or Solana
4. **Allow Multiple Wallets** - Settings → Embedded Wallets → Enable "Allow multiple embedded wallets per chain"
5. **Configure Networks** - Settings → Chains & Networks → Enable desired networks
6. **Configure ZeroDev (optional)** - Settings → Embedded Wallets → ZeroDev for gas sponsorship

## Dependencies

- `@dynamic-labs-sdk/client` - Core SDK
- `@dynamic-labs-sdk/evm` - EVM chain support
- `@dynamic-labs-sdk/solana` - Solana chain support
- `@dynamic-labs-sdk/zerodev` - Account abstraction & gas sponsorship
- `viem` - EVM utilities
- `@solana/web3.js` - Solana utilities
- `@tanstack/react-query` - Data fetching & mutations

## Webhooks

This demo includes a webhook endpoint at `/api/webhooks/dynamic` for receiving events from Dynamic.

### Setup

1. **Configure webhook in Dynamic Dashboard:**
   - Go to Developer Dashboard → Webhooks
   - Add endpoint URL: `https://your-domain.com/api/webhooks/dynamic`
   - Select events to subscribe to (e.g., `user.created`, `wallet.linked`)
   - Copy the webhook secret

2. **Add webhook secret to environment:**

   ```
   DYNAMIC_WEBHOOK_SECRET=your_webhook_secret_here
   ```

### Local Development

To test webhooks locally, you need to expose your local server to the internet. Options:

- **[ngrok](https://ngrok.com/)** - `ngrok http 3000` → use the generated URL
- **[localtunnel](https://localtunnel.github.io/www/)** - `npx localtunnel --port 3000`
- **[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)**

Example with ngrok:

```bash
# Terminal 1: Start your app
pnpm dev

# Terminal 2: Expose to internet
ngrok http 3000
# Output: https://abc123.ngrok.io → http://localhost:3000

# Use https://abc123.ngrok.io/api/webhooks/dynamic as your webhook URL
```

### Signature Verification

The endpoint verifies webhook signatures using HMAC SHA256:

```typescript
// app/api/webhooks/dynamic/route.ts
const isValid = verifySignature({
  secret: webhookSecret,
  signature: request.headers.get("x-dynamic-signature"),
  payload,
});
```

If `DYNAMIC_WEBHOOK_SECRET` is not set, signature verification is skipped (useful for local development).

### Common Webhook Events

| Event                  | Description                    |
| ---------------------- | ------------------------------ |
| `user.created`         | New user signed up             |
| `user.session.created` | User logged in                 |
| `wallet.created`       | Embedded wallet created        |
| `wallet.linked`        | External wallet linked         |
| `wallet.transferred`   | Wallet transferred to new user |

See [Webhook Events](https://dynamic.xyz/docs/developer-dashboard/webhooks/events) for full list.

## Learn More

- [Dynamic JS SDK Documentation](https://www.dynamic.xyz/docs/javascript)
- [Embedded Wallets Guide](https://www.dynamic.xyz/docs/javascript/reference/waas/checking-if-waas-is-enabled)
- [ZeroDev Integration](https://www.dynamic.xyz/docs/javascript/reference/zerodev/adding-zerodev-extension)
- [Webhooks Overview](https://dynamic.xyz/docs/developer-dashboard/webhooks/overview)
- [Webhook Signature Verification](https://docs.dynamic.xyz/guides/webhooks-signature-validation)
