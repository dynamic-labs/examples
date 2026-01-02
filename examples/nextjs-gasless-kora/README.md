# Gasless Solana Transactions with Dynamic SDK and Kora

A Next.js demo showcasing **gasless transactions on Solana** using Dynamic SDK for wallet management and Kora for fee abstraction. Users can send transactions without needing SOL in their wallet - fees are paid in SPL tokens instead.

## What This Demo Shows

This example demonstrates how to:

- **Connect Solana wallets** using Dynamic SDK
- **Create gasless transactions** where fees are paid in SPL tokens (e.g., USDC) instead of SOL
- **Integrate Kora** for transaction fee abstraction
- **Build and sign transactions** with proper compute budget instructions
- **Submit transactions** to the Solana network with Kora co-signing

## Key Features

| Feature               | Description                                        |
| --------------------- | -------------------------------------------------- |
| 🔐 Dynamic SDK        | Seamless Solana wallet connection and management   |
| ⛽ Gasless            | Pay transaction fees in SPL tokens, not SOL        |
| 🔄 Kora Integration   | Fee abstraction service for Solana transactions    |
| 📝 Memo Transactions  | Simple demo transaction (easily extensible)        |
| ✅ Transaction Status | Real-time status updates and confirmation tracking |

## How Gasless Transactions Work

```text
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  User builds    │ ──▶  │  Kora estimates │ ──▶  │  Payment        │
│  transaction    │      │  fee in SPL     │      │  instruction    │
│                 │      │  token          │      │  added          │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  User signs     │ ◀──  │  Transaction    │ ◀──  │  Final tx built │
│  transaction    │      │  with payment   │      │  with payment   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  Kora co-signs  │ ──▶  │  Submit to      │
│  as fee payer   │      │  Solana network │
└─────────────────┘      └─────────────────┘
```

**Key steps:**

1. User builds transaction with their instructions
2. Kora estimates the fee and creates a payment instruction (paid in SPL token)
3. User signs the transaction (including payment instruction)
4. Kora co-signs as the fee payer
5. Transaction is submitted to Solana network

## Quick Start

### Prerequisites

- Node.js 18+ and a package manager (pnpm recommended)
- A [Dynamic](https://app.dynamic.xyz) account and environment ID
- A running Kora instance (see [Kora Setup](#kora-setup))

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables template
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following:

```bash
# Dynamic SDK
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-dynamic-environment-id

# Solana RPC (optional, defaults to devnet)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_WS_URL=wss://api.devnet.solana.com

# Kora RPC (defaults to localhost)
NEXT_PUBLIC_KORA_RPC_URL=http://localhost:8080/
```

Get your Dynamic environment ID from the [Dynamic Dashboard](https://app.dynamic.xyz).

### Kora Setup

This example requires a running Kora instance. You can:

1. **Run Kora locally** - Follow the [Kora setup guide](https://github.com/solana-foundation/kora) to run a local instance
2. **Use a hosted Kora instance** - Update `NEXT_PUBLIC_KORA_RPC_URL` to point to your Kora server

For local development, Kora typically runs on `http://localhost:8080/`.

### Run the Demo

```bash
# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and:

1. Click **Connect Wallet** to connect your Solana wallet via Dynamic
2. Click **Send Gasless Transaction** to create and submit a gasless transaction
3. Watch the status updates as the transaction is processed
4. View the transaction on Solscan when confirmed

## Project Structure

```text
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Main page with wallet connection
│   └── globals.css                   # Global styles
│
├── components/
│   └── gasless-transaction-demo.tsx  # Main gasless transaction component
│
├── lib/
│   └── providers.tsx                 # Dynamic SDK provider setup
│
└── package.json                      # Dependencies
```

## How It Works

### 1. Dynamic SDK Integration

The app uses Dynamic SDK to connect and manage Solana wallets:

```typescript
import { useSolanaWallet } from "@dynamic-labs/solana";

const { publicKey, signTransaction } = useSolanaWallet();
```

### 2. Kora Client Setup

Initialize the Kora client to interact with the fee abstraction service:

```typescript
import { KoraClient } from "@solana/kora";

const koraClient = new KoraClient({
  rpcUrl: process.env.NEXT_PUBLIC_KORA_RPC_URL,
});
```

### 3. Transaction Flow

The gasless transaction flow follows these steps:

1. **Get Kora signer** - Retrieve the address that will pay fees
2. **Get payment token** - Determine which SPL token to use for fees
3. **Build estimate transaction** - Create a transaction to estimate fees
4. **Get payment instruction** - Request payment instruction from Kora
5. **Build final transaction** - Combine user instructions with payment instruction
6. **Sign with user wallet** - User signs the transaction
7. **Get Kora signature** - Kora co-signs as fee payer
8. **Submit to network** - Send transaction to Solana

### 4. Extending the Demo

The current demo sends a simple memo instruction. You can extend it to:

- **Token transfers** - Use `@solana-program/token` to transfer SPL tokens
- **SOL transfers** - Transfer native SOL
- **Program interactions** - Call any Solana program
- **Multiple instructions** - Combine multiple operations in one transaction

Example: Add a token transfer instruction:

```typescript
import { getTransferInstruction } from "@solana-program/token";

const transferInstruction = getTransferInstruction({
  source: sourceTokenAccount,
  destination: destinationTokenAccount,
  amount: 1000000n, // 1 token (6 decimals)
  owner: publicKey,
});

const instructions = [transferInstruction, memoInstruction];
```

## Configuration

### Compute Budget

The demo uses default compute budget settings:

```typescript
const CONFIG = {
  computeUnitLimit: 200_000,
  computeUnitPrice: 1_000_000n, // 0.001 SOL per compute unit
};
```

Adjust these based on your transaction complexity.

### Transaction Version

The demo uses version 0 (legacy) transactions. For versioned transactions:

```typescript
const transactionVersion = 0 as TransactionVersion; // or 1 for versioned
```

## Troubleshooting

### "Wallet not connected"

- Ensure you've connected a Solana wallet through Dynamic
- Check that `useSolanaWallet()` returns a valid `publicKey` and `signTransaction`

### "Kora RPC error"

- Verify Kora is running and accessible at the configured URL
- Check network connectivity and CORS settings
- For local development, ensure Kora is running on `http://localhost:8080/`

### "Transaction failed"

- Check that your wallet has sufficient SPL tokens for fees
- Verify the Solana RPC endpoint is accessible
- Check transaction logs for specific error messages

### "Payment instruction failed"

- Ensure the payment token is configured in Kora
- Verify the source wallet has sufficient balance of the payment token
- Check Kora's validation configuration

## Documentation

- [Dynamic SDK Docs](https://www.dynamic.xyz/docs) - Wallet connection and management
- [Kora Documentation](https://github.com/solana-foundation/kora) - Fee abstraction service
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) - Solana transaction building
- [Solana Cookbook](https://solanacookbook.com/) - Solana development patterns

## Tech Stack

- **[Next.js 15](https://nextjs.org/)** - React framework
- **[Dynamic SDK](https://www.dynamic.xyz/)** - Wallet authentication and management
- **[Kora](https://github.com/solana-foundation/kora)** - Solana fee abstraction
- **[@solana/kit](https://github.com/solana-labs/solana-web3.js)** - Solana transaction building
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling

## License

MIT
