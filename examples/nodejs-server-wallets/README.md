# Dynamic Server-Side Wallet Management

Comprehensive server-side wallet management examples using Dynamic's SDK. From basic wallet operations to complex fund aggregation patterns, these examples demonstrate how to build secure, scalable financial infrastructure.

## 📁 Project Structure

```
src/
├── server-wallet/          # Standard SDK server wallet operations
│   ├── wallet.ts           # Create, list, delete wallets
│   ├── send-transaction.ts # Send txns (standard, zerodev, pimlico)
│   └── sign-message.ts     # Sign messages for authentication
│
├── delegated/              # Delegated wallet operations
│   ├── README.md           # Prerequisites and setup guide
│   ├── send-transaction.ts # Send txns with delegated access
│   ├── sign-message.ts     # Sign messages with delegated access
│   └── wallet.json.example # Template for delegated credentials
│
├── examples/               # End-to-end workflow demos
│   └── omnibus-sweep.ts    # Fund aggregation pattern
│
├── api/                    # Direct API calls (no SDK) - coming soon
│
└── lib/                    # Shared utilities
    ├── cli.ts              # CLI helpers (runScript, parseArgs)
    ├── config.ts           # Centralized configuration
    ├── dynamic.ts          # Dynamic client factories
    ├── pimlico.ts          # Pimlico smart account setup
    ├── viem.ts             # Viem wallet client helpers
    ├── utils.ts            # Formatting utilities
    ├── wallet-helpers.ts   # Wallet retrieval helpers
    └── wallet-storage.ts   # Local JSON storage (dev only)
```

## 🎯 What You'll Learn

### Server Wallet Operations (`src/server-wallet/`)

- Create ephemeral or persistent server-side wallets
- Password protection for enhanced security
- List and manage saved wallets with local storage
- Send transactions with multiple gas providers
- Sign messages for authentication

### Delegated Wallet Operations (`src/delegated/`)

- Use wallets where users have granted delegation access
- Sign and send on behalf of users
- Understand the delegation credential flow

### End-to-End Examples (`src/examples/`)

- **Omnibus Sweep**: Create multiple customer wallets, fund them, and sweep all funds to a centralized omnibus account

## 🛡️ Security Features

- **2-of-2 threshold signatures**: Requires both server and client approval
- **Per-account password**: Optional password protection for each wallet
- **TSS-MPC architecture**: Distributed key management for enhanced security
- **Flexible key management**: Dynamic manages client shares or self-manage

## 🏗️ Technical Stack

- **Dynamic SDK**: Server-side wallet creation and transaction signing
- **Pimlico & ZeroDev**: Gasless transaction sponsorship
- **Viem**: Ethereum transaction encoding and blockchain interaction
- **Base Sepolia testnet**: Test environment

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Dynamic API credentials
- Pimlico API key (for gasless transactions)

## ⚙️ Setup

1. **Install dependencies**:
  ```bash
   pnpm install
  ```
2. **Configure environment**:
  ```bash
   cp .env.example .env
   # Edit .env with your credentials
  ```
   Required variables:

## 🎯 Running the Examples

### Server Wallet Management

```bash
# Create ephemeral wallet (not saved)
pnpm wallet --create

# Create and save wallet for reuse
pnpm wallet --create --save

# Create wallet with password protection
pnpm wallet --create --save --password mySecretPassword

# List all saved wallets
pnpm wallet --list

# Delete a saved wallet
pnpm wallet --delete 0x123...
```

### Message Signing

```bash
# Sign with new ephemeral wallet
pnpm sign-msg "Hello, World"

# Sign with saved wallet
pnpm sign-msg "Hello, World" --address 0x123...

# Sign with password-protected wallet
pnpm sign-msg "Hello, World" --address 0x123... --password myPassword
```

### Send Transactions

```bash
# Standard transaction (user pays gas)
pnpm send-txn standard

# Gasless with ZeroDev
pnpm send-txn zerodev

# Gasless with Pimlico
pnpm send-txn pimlico

# Use saved wallet
pnpm send-txn zerodev --address 0x123...

# Use password-protected wallet
pnpm send-txn pimlico --address 0x123... --password myPassword
```

### Delegated Wallet Operations

> ⚠️ Requires `src/delegated/wallet.json` with delegated credentials.
> See `src/delegated/README.md` for setup instructions.

```bash
# Sign message with delegated wallet
pnpm delegated:sign-msg "Hello, World!"

# Send transaction with delegated wallet
pnpm delegated:send-txn
```

### End-to-End Examples

```bash
# Omnibus sweep with default settings (10 wallets)
pnpm example:omnibus

# Omnibus sweep with custom number of wallets
pnpm example:omnibus 20
```

## 📊 Sample Output

### Wallet Creation

```
Creating server wallet...
✅ Server wallet created in 2.34s
📍 Address: 0x7E3629...5A02f0
💡 Tip: Add '--save' flag to persist wallet for reuse
```

### Message Signing

```
Signing message...

✅ Message signed in 1.45s
📝 Message: "Hello, World!"
✍️ Signature: 0xabc123...def456
👛 Signer: 0x7E3629...5A02f0
```

### Send Transaction

```
Creating Pimlico smart account...
Sending gasless transaction (Pimlico)...

✅ Transaction sent in 3.21s
📝 Hash: 0x789...012
🔗 Explorer: https://sepolia.basescan.org/tx/0x789...012
💳 Provider: pimlico
👛 Wallet: 0x7E3629...5A02f0
```

### Omnibus Sweep

```
Dynamic Gasless Transaction Demo - Omnibus Sweep
============================================================
Configuration: 10 wallets, funding random USDC amounts up to 1000
============================================================

Creating omnibus wallet for fund aggregation...
Omnibus wallet created: 0xbBdf18...c10B74

Creating 10 customer wallets...
Customer wallet 1 created: 0x7E3629...5A02f0
...

Funding 10 customer wallets with USDC tokens...
Funded customer wallet 1 (0x7E3629...5A02f0): 33 USDC
...

Sweeping funds from 10 customer wallets to omnibus account...
Swept customer wallet 1 (0x7E3629...5A02f0): 33 USDC to omnibus
...

============================================================
Demo completed successfully.
Total USDC transferred: 333 USDC
Omnibus wallet address: 0xbBdf18...c10B74
```

