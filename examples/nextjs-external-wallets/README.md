# Dynamic External Wallets Example

A Next.js demo showcasing how to connect and manage multiple **external wallets** (MetaMask, Coinbase Wallet, Phantom, etc.) using the Dynamic SDK with a fully custom UI.

## What This Demo Shows

This example demonstrates building a complete multi-wallet management interface using Dynamic's hooks and APIs instead of the default Dynamic widget. You'll learn how to:

- **Authenticate with external wallets** using connect-and-sign mode
- **Link multiple wallets** to a single user account (both Ethereum and Solana)
- **Build custom wallet UI** with your own components
- **Switch networks** on Ethereum wallets
- **Switch between wallets** to change the active/primary wallet
- **Remove wallets** from a user's account
- **Listen to network changes** and update UI reactively

## Key Features

| Feature              | Description                                     |
| -------------------- | ----------------------------------------------- |
| 🔐 Connect-and-Sign  | Users sign a message to prove wallet ownership  |
| 🔗 Multi-Wallet      | Link Ethereum and Solana wallets to one account |
| 🎨 Custom UI         | Build your own wallet management interface      |
| 🌐 Network Switching | Change networks on Ethereum wallets             |
| ⚡ Reactive Updates  | UI updates when network changes occur           |
| 📱 Responsive        | Mobile-friendly design                          |

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Add your Dynamic environment ID to .env.local
# Get your ID from https://app.dynamic.xyz

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and try:

1. Click **Login** to connect with an external wallet
2. Sign the authentication message
3. Click **Link New Wallet** to add more wallets
4. Click on a wallet to make it the primary wallet
5. Use the network dropdown to switch networks (Ethereum wallets)
6. Click the trash icon to remove a wallet

## How Connect-and-Sign Works

This demo uses Dynamic's `connect-and-sign` authentication mode, which provides a more secure flow than simple wallet connection:

```text
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   User clicks   │ ──▶  │  Wallet popup   │ ──▶  │   Sign message  │
│     Login       │      │   (connect)     │      │   (authenticate)│
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   JWT issued    │ ◀──  │  Wallet linked  │ ◀──  │ Ownership proved│
│   (auth token)  │      │   to account    │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

**Key differences from connect-only:**

- Users must sign a message to prove they own the wallet
- Wallets are persisted to the user's profile (not just the browser session)
- Users receive a JWT for authenticated API requests
- Wallets remain linked even if disconnected from the browser extension

## Project Structure

```text
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Main wallet management page
│   ├── globals.css             # Global styles with Tailwind
│   └── methods/
│       └── page.tsx            # SDK methods playground
│
├── components/
│   ├── dynamic/
│   │   ├── dynamic-active-wallet.tsx   # Primary wallet with network selector
│   │   ├── dynamic-auth-button.tsx     # Login/logout button
│   │   ├── dynamic-methods.tsx         # SDK methods playground component
│   │   ├── dynamic-wallet-item.tsx     # Single wallet card (click to switch)
│   │   ├── dynamic-wallet-list.tsx     # List of all connected wallets
│   │   ├── dynamic-widget.tsx          # Dynamic's built-in widget wrapper
│   │   └── logo.tsx                    # Dynamic logo SVG
│   ├── header.tsx              # App header with navigation
│   ├── footer.tsx              # App footer with links
│   └── ui/                     # shadcn/ui components
│
├── lib/
│   ├── dynamic.ts              # Dynamic SDK re-exports
│   ├── get-wallet-network.ts   # Network info fetching utility
│   ├── providers.tsx           # App providers (Dynamic, Theme, etc.)
│   ├── truncate-address.ts     # Address formatting utility
│   └── utils.ts                # Tailwind class merging utility
```

## Key Dynamic SDK Hooks

This example uses several Dynamic SDK hooks:

| Hook                  | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `useIsLoggedIn()`     | Check if user is authenticated               |
| `useDynamicContext()` | Access primary wallet, user, SDK state       |
| `useUserWallets()`    | Get all wallets linked to the user           |
| `useSwitchWallet()`   | Switch the primary wallet                    |
| `useDynamicModals()`  | Control Dynamic's modals (link wallet, etc.) |

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and add your Dynamic environment ID:

```bash
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-environment-id-here
```

Get your environment ID from the [Dynamic Dashboard](https://app.dynamic.xyz).

### SDK Configuration

The Dynamic SDK is configured in `lib/providers.tsx`:

```typescript
<DynamicContextProvider
  theme="light"
  settings={{
    // Require signature to prove wallet ownership
    initialAuthenticationMode: "connect-and-sign",

    // Your environment ID from .env.local
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,

    // Enable Ethereum and Solana wallets
    walletConnectors: [EthereumWalletConnectors, SolanaWalletConnectors],
  }}
>
```

### Key Settings

- **`initialAuthenticationMode: "connect-and-sign"`** - Requires users to sign a message for authentication
- **`walletConnectors`** - Array of wallet connector modules to enable
- **`environmentId`** - Your project ID from the [Dynamic Dashboard](https://app.dynamic.xyz)

## Customization

### Adding More Networks

Networks are configured in the Dynamic Dashboard under **Chains & Networks**. The example automatically fetches enabled networks and displays them in the network selector.

### Adding More Wallet Providers

Wallet providers are also configured in the Dashboard. The SDK automatically supports any wallets you enable for your environment.

### Styling

The example uses Tailwind CSS with shadcn/ui components. Customize styles in:

- `app/globals.css` - CSS variables and base styles
- Component files - Tailwind classes directly on elements

## Documentation

- [Multi-Wallet Documentation](https://www.dynamic.xyz/docs/wallets/external-wallets/multi-wallet)
- [Connect-and-Sign Mode](https://www.dynamic.xyz/docs/wallets/external-wallets/connected-vs-authenticated)
- [Custom UI Guide](https://www.dynamic.xyz/docs/wallets/external-wallets/multi-wallet#custom-ui-multi-wallet)
- [Dynamic Dashboard](https://app.dynamic.xyz)

## Tech Stack

- **[Next.js 15](https://nextjs.org/)** - React framework
- **[Dynamic SDK](https://www.dynamic.xyz/)** - Wallet authentication
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[shadcn/ui](https://ui.shadcn.com/)** - UI components
- **[viem](https://viem.sh/)** - Ethereum utilities
