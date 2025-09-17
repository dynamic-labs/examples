# Stablecoin Payment Links

A decentralized payment link generator and processor for USDC transactions on Base Sepolia testnet. This application allows users to create shareable payment links and process USDC payments seamlessly through a web interface.

## Features

- **Payment Link Generation**: Create shareable payment links with preset amounts, descriptions, and references
- **USDC Payments**: Process USDC token transfers on Base Sepolia testnet
- **Wallet Integration**: Connect with any Ethereum-compatible wallet using Dynamic
- **Automatic Network Switching**: Automatically switches to Base Sepolia when needed
- **Dark/Light Mode**: Toggle between dark and light themes
- **Payment Processing**: Complete payments directly through generated links
- **Transaction Details**: View comprehensive payment information before confirming

## How It Works

1. **Generate Payment Links**: Connect your wallet and create payment links with:

   - Amount in USDC
   - Optional description (e.g., "Coffee payment")
   - Optional reference ID (e.g., "invoice-001")

2. **Share Links**: Copy and share the generated payment links with anyone

3. **Process Payments**: Recipients can use the links to:
   - View payment details
   - Connect their wallet
   - Complete USDC transfers on Base Sepolia

This project was built using [Create Dynamic App](https://github.com/dynamic-labs/create-dynamic-app).

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Wallet Integration**: Dynamic Labs SDK
- **Blockchain**: Ethereum-compatible wallets (Base Sepolia testnet)
- **Token**: USDC (USD Coin) on Base Sepolia
- **Styling**: CSS with dark/light theme support

## Prerequisites

- An Ethereum-compatible wallet (MetaMask, WalletConnect, etc.)
- Base Sepolia testnet added to your wallet
- Test USDC tokens on Base Sepolia (for testing payments)
- Dynamic environment ID from [Dynamic Dashboard](https://app.dynamic.xyz)

## Getting Started

### Set up your environment variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Update the `VITE_DYNAMIC_ENVIRONMENT_ID` in the `.env` file with your own environment ID from [Dynamic Dashboard](https://app.dynamic.xyz).

### Install dependencies

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:5173](http://localhost:5173) to view your application in the browser.

## Available Scripts

- `dev`: Starts the development server
- `build`: Builds the app for production
- `preview`: Previews the production build locally
- `lint`: Lints the codebase

## Learn More

- [Dynamic Documentation](https://docs.dynamic.xyz)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
