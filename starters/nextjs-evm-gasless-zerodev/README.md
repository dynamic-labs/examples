# Dynamic Gasless Starter with ZeroDev

A Next.js demo showcasing gasless transactions using Dynamic's embedded TSS-MPC wallets with account abstraction.

## What This Demo Does

This application demonstrates:

- **Email-based wallet creation** - Users sign up with just an email address
- **Embedded TSS-MPC wallets** - Secure, non-custodial wallets with account abstraction capabilities
- **Gasless token minting** - Users can mint $100 worth of test tokens without paying gas fees
- **Seamless UX** - All the complexity of account abstraction is hidden from users

## Key Features

- 🔐 **Email authentication** with Dynamic embedded TSS-MPC wallets
- ⚡ **Account abstraction** - enhanced wallet capabilities with the same user experience
- 💸 **Gas sponsorship** - transactions paid for by the application
- 🪙 **Token minting** with gasless transactions

## Quick Start

1. Clone and install dependencies:

```bash
npm install
```

2. Set up your environment variables (see `.env.example`)

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) and try:
   - Sign up with your email
   - Mint tokens (gasless!)
   - View transaction on block explorer

## How It Works

This demo uses Dynamic's embedded TSS-MPC wallets with account abstraction capabilities. When users sign up:

1. An embedded TSS-MPC wallet is created via email authentication
2. The wallet automatically gains account abstraction features
3. Gas is sponsored for qualifying transactions
4. Users can interact normally while benefiting from enhanced wallet capabilities

## Full Documentation

For complete setup instructions, advanced configuration, and production deployment, see the [Dynamic ZeroDev Documentation](https://www.dynamic.xyz/docs/smart-wallets/smart-wallet-providers/zerodev).

## Tech Stack

- **Next.js 14** - React framework
- **Dynamic SDK** - Authentication and wallet management
- **ZeroDev** - Account abstraction provider
- **Tailwind CSS** - Styling
