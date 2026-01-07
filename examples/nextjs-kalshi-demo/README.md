# Kalshi Predictions Market Demo

A modern predictions market demo application built with Next.js, Dynamic Labs, and Solana. Users can browse Kalshi-style prediction markets, filter by categories and tags, place trades, and manage their positions using Solana wallets.

## Features

- **Market Browsing**: View prediction markets with real-time prices, trader counts, and time remaining
- **Search & Filter**: Search markets by question, filter by category (Politics, Crypto, Sports, etc.), and sort by various criteria
- **Trading**: Place market orders on prediction markets via Solana
- **Portfolio Management**: View positions and active orders
- **Wallet Integration**: Seamless Solana wallet connection powered by Dynamic Labs
- **Responsive Design**: Modern UI built with Tailwind CSS and a purple/cyan gradient theme

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: Dynamic Labs SDK with Solana support
- **Blockchain**: Solana
- **State Management**: React Query + React Hooks
- **Animations**: Motion (Framer Motion)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or bun)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables. Create a `.env.local` file:

```bash
NEXT_PUBLIC_DYNAMIC_ENV_ID=your_dynamic_environment_id
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet.solana.com # Optional
```

3. Start the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linter

## Project Structure

```text
src/
├── app/                  # Next.js app router pages and API routes
│   └── api/              # API routes for Kalshi markets
│       └── kalshi/       # Market data endpoints
├── components/           # React components
│   ├── positions/        # Portfolio and positions management
│   └── ui/               # UI components (Toast, etc.)
├── lib/                  # Utilities and integrations
│   ├── constants/        # Contract addresses, network config
│   ├── dynamic/          # Dynamic Labs SDK re-exports
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
└── styles/               # Global styles
```

## Environment Variables

### Required

- `NEXT_PUBLIC_DYNAMIC_ENV_ID` - Your Dynamic Labs environment ID

### Optional

- `NEXT_PUBLIC_SOLANA_RPC_URL` - Custom Solana RPC endpoint (defaults to mainnet-beta)
- `DFLOW_API_KEY` - DFlow API key for authenticated requests

## How It Works

### Market Data

The demo fetches market data from a mock API that simulates Kalshi-style prediction markets. In production, you would:

1. Connect to the Kalshi API for real market data
2. Use DFlow for order execution on Solana
3. Query on-chain data for positions and balances

### Trading Flow

1. User connects a Solana wallet via Dynamic
2. User browses markets and selects Yes/No
3. User enters bet amount
4. Transaction is built and signed via Dynamic wallet
5. Order is submitted to the Solana network

### Solana Integration

The demo uses:

- **@solana/web3.js** for Solana RPC interactions
- **@solana/spl-token** for USDC balance queries
- **Dynamic Labs Solana SDK** for wallet connection and signing

## Customization

### Theming

The app uses a purple-to-cyan gradient theme. Customize colors in:

- `src/styles/globals.css` - CSS variables and Dynamic modal styling
- Component files - Tailwind classes

### Adding Real Kalshi Integration

To connect to the real Kalshi API:

1. Obtain Kalshi API credentials
2. Update `src/app/api/kalshi/route.ts` to call the Kalshi Trading API
3. Implement proper authentication and order placement

### Adding DFlow Integration

To enable real trading via DFlow:

1. Set up DFlow API access
2. Update `src/lib/hooks/useKalshiTrading.ts` to call DFlow Trade API
3. Handle order signing and confirmation

## Architecture

The demo is designed with a clean separation of concerns:

- **API Routes**: Server-side data fetching and transformation
- **Custom Hooks**: Business logic for markets and trading
- **Components**: Pure UI components with minimal logic
- **Types**: Shared TypeScript interfaces

## Security Considerations

- Never expose API keys in client-side code
- Use server-side API routes for authenticated requests
- Validate all user input before transactions
- Implement proper error handling for failed transactions

## License

MIT
