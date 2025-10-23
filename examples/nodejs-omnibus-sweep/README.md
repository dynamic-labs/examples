# Dynamic Server-Side Wallet Management

This collection of demos shows comprehensive server-side wallet management workflows using Dynamic's SDK. From basic wallet operations to complex fund aggregation patterns, these examples demonstrate how to build secure, scalable financial infrastructure.

## 🎯 What You'll Learn

These demos cover the complete spectrum of server-side wallet operations:

### 1. Wallet Management

- Create ephemeral or persistent server-side wallets
- Password protection for enhanced security
- List and manage saved wallets with local storage
- Complete wallet lifecycle (create, save, list, delete)

### 2. Transaction Signing & Sending

- Sign messages for authentication and verification
- Send transactions with multiple gas providers:
  - Standard (user pays gas)
  - ZeroDev (gasless sponsorship)
  - Pimlico (gasless sponsorship)
- Support for both new and saved wallets

### 3. Omnibus Fund Aggregation

- Create multiple customer wallets and centralized omnibus accounts
- Fund customer wallets with USDC tokens
- Sweep all funds to omnibus account in parallel
- Rate-limited wallet creation and concurrent transaction processing

## 🛡️ Security Features

- **2-of-2 threshold signatures**: Requires both server and client approval for all transactions
- **Per account password**: Optionally, a password can be set for each account upon creation
- **TSS-MPC architecture**: Distributed key management across multiple parties for enhanced security
- **Flexible key management**: Dynamic can manage client share keys or you can manage them yourself

## 🏗️ Technical Stack

- **Dynamic SDK**: Server-side wallet creation, signature management, and transaction signing
- **Pimlico & ZeroDev**: Gasless transaction sponsorship providers
- **Viem**: Ethereum transaction encoding and blockchain interaction
- **Base Sepolia testnet**: Test environment for demonstrations

## 📋 Prerequisites

- Node.js 18+ and pnpm package manager
- Dynamic API access with valid credentials
- Pimlico API key for gasless transactions

## ⚙️ Setup

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Configure environment**:
   Create a `.env` file with your API credentials:
   ```bash
   DYNAMIC_API_TOKEN=your_dynamic_api_token
   DYNAMIC_ENVIRONMENT_ID=your_environment_id
   PIMLICO_API_KEY=your_pimlico_api_key
   ```

## 🎯 Running the Demos

### 1. Wallet Management (`pnpm wallet`)

Create and manage server-side wallets with various options:

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

### 2. Message Signing (`pnpm sign-msg`)

Sign messages for authentication and verification:

```bash
# Sign with new ephemeral wallet
pnpm sign-msg "Hello, World!"

# Sign with saved wallet
pnpm sign-msg "Hello, World!" --address 0x123...

# Sign with password-protected wallet
pnpm sign-msg "Hello, World!" --address 0x123... --password myPassword
```

### 3. Send Transactions (`pnpm send-txn`)

Send transactions with different gas sponsorship options:

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

### 4. Omnibus Sweep (`pnpm omnibus`)

Create multiple customer wallets, fund them, and sweep all funds to an omnibus account:

```bash
# Run with default settings (10 wallets)
pnpm omnibus

# Run with custom number of wallets
pnpm omnibus 20
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
[... additional wallet creation logs ...]

Funding 10 customer wallets with USDC tokens...
Funded customer wallet 1 (0x7E3629...5A02f0): 33 USDC
[... additional funding transaction logs ...]

Sweeping funds from 10 customer wallets to omnibus account...
Swept customer wallet 1 (0x7E3629...5A02f0): 33 USDC to omnibus
[... additional sweep transaction logs ...]

============================================================
Demo completed successfully.
Total USDC transferred: 333 USDC
Omnibus wallet address: 0xbBdf18...c10B74
```
