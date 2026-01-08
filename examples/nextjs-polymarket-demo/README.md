# Predictions Market Demo

A modern predictions market demo application built with Next.js and Dynamic Labs. Users can browse Polymarket prediction markets, filter by categories and tags, place trades, and manage their positions.

## Features

- **Market Browsing**: View prediction markets with real-time prices, trader counts, and time remaining
- **Search & Filter**: Search markets by question, filter by category (Game Lines, Futures, Specials), and sort by various criteria
- **Trading**: Place market and limit orders on Polymarket via the CLOB API
- **Portfolio Management**: View positions, active orders, and sell/cancel functionality
- **Wallet Integration**: Seamless wallet connection and management powered by Dynamic Labs
- **Multiple Deposit Options**:
  - Credit card payments via Checkout.com
  - Cross-chain bridging via LI.FI
  - QR code for receiving funds
  - External wallet funding
- **Responsive Design**: Modern UI built with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: Dynamic Labs SDK
- **Payments**: Checkout.com
- **Bridging**: LI.FI SDK
- **Trading**: Polymarket CLOB Client
- **State Management**: React Query + React Hooks

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables. Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
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
│   └── api/              # API routes for Polymarket, Checkout, Coinbase
├── components/           # React components
│   ├── checkout-flow/    # Credit card payment flow
│   ├── coinbase-onramp/  # Shared onramp components
│   ├── deposit/          # Deposit flow components
│   ├── positions/        # Portfolio and positions management
│   └── ui/               # UI components (Toast, Modal, etc.)
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
- `NEXT_PUBLIC_CHECKOUT_PUBLIC_KEY` - Checkout.com public key
- `CHECKOUT_SECRET_KEY` - Checkout.com secret key
- `CHECKOUT_API_URL` - Checkout.com API URL

### Optional

- `NEXT_PUBLIC_CHECKOUT_ENVIRONMENT` - Checkout.com environment (sandbox/production)
- `NEXT_PUBLIC_LIFI_API_KEY` - LI.FI API key for bridging
- `CHECKOUT_PROCESSING_CHANNEL_ID` - Checkout.com processing channel ID

## Design

The original design is available on [Figma](https://www.figma.com/design/eua3PPQD7MeMzuT1aDwHq0/Predictions-Market-UI--Copy---Copy-).
