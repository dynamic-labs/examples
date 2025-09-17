# Mayan Cross-Chain Swap

A modern web application for performing cross-chain token swaps using the Mayan protocol. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Cross-Chain Swaps**: Swap tokens between different blockchain networks
- **Supported Chains**: Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism, and Base
- **Wallet Integration**: Connect with various wallets through Dynamic Labs
- **Real-Time Quotes**: Get instant quotes for your swaps
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Wallet Integration**: Dynamic Labs SDK
- **Cross-Chain Protocol**: Mayan Finance SDK
- **Package Manager**: Bun

## Getting Started

1. **Install dependencies**:

   ```bash
   bun install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with your Dynamic Labs environment ID:

   ```env
   NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_environment_id_here
   ```

3. **Run the development server**:

   ```bash
   bun run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Connect Wallet**: Connect your wallet using Dynamic Labs
2. **Select Chains**: Choose source and destination chains
3. **Select Tokens**: Pick the tokens you want to swap
4. **Enter Amount**: Specify the amount to swap
5. **Get Quotes**: Fetch available swap routes from Mayan
6. **Execute Swap**: Choose a route and execute the swap

## Supported Networks

- **Ethereum**: Mainnet and Layer 2s
- **Polygon**: Polygon PoS
- **BSC**: Binance Smart Chain
- **Avalanche**: Avalanche C-Chain
- **Arbitrum**: Arbitrum One
- **Optimism**: Optimism
- **Base**: Coinbase Base

## Development

- **Build**: `bun run build`
- **Start**: `bun run start`
- **Lint**: `bun run lint`

## Learn More

- [Mayan Finance Documentation](https://docs.mayan.finance/)
- [Mayan API Reference](https://price-api.mayan.finance/swagger/)
- [Dynamic Labs Documentation](https://docs.dynamic.xyz/)
- [Next.js Documentation](https://nextjs.org/docs)
