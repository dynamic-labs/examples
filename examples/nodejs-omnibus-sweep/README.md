# Dynamic Omnibus Sweep

This demo shows a complete server-side wallet management workflow. It uses Dynamic's SDK to create wallets, execute gasless transactions, and aggregate funds through an omnibus account structure.

## 🎯 Demo Overview

The omnibus sweep pattern performs three main steps:

1. **Create wallets**: Generate multiple customer wallets and one omnibus account
2. **Fund wallets**: Add random USDC amounts to each customer wallet
3. **Sweep funds**: Transfer all funds from customer wallets to the omnibus account

This workflow demonstrates:

### 1. Programmatic Wallet Creation

- Server-side creation of customer wallets with 2-of-2 threshold signatures
- Automatic generation of omnibus accounts for fund collection
- Complete wallet lifecycle management handled server-side

### 2. Gasless USDC Operations

- Mint USDC tokens to customer wallets without paying gas fees
- Transfer USDC from customer wallets to omnibus without gas fees
- Zero-friction token operations for seamless user experience

### 3. Omnibus Fund Aggregation

- Centralized collection of customer funds into omnibus accounts
- Streamlined settlement processing for financial institutions
- Clear separation and tracking of customer funds

### 4. Scalable Concurrent Processing

- Rate-limited wallet creation (1 wallet per second) to respect API limits
- Parallel transaction processing (up to 10 concurrent operations)
- Optimized performance for handling multiple customer wallets

## 🛡️ Security Features

- **2-of-2 threshold signatures**: Requires both server and client approval for all transactions
- **Per account password**: Optionally, a password can be set for each account upon creation
- **TSS-MPC architecture**: Distributed key management across multiple parties for enhanced security
- **Flexible key management**: Dynamic can manage client share keys or you can manage them yourself

## 🏗️ Technical Stack

- **Dynamic SDK**: Handles server-side wallet creation and signature management
- **Pimlico**: Provides gasless transaction sponsorship on Base Sepolia testnet
- **Viem**: Manages Ethereum transaction encoding and blockchain interaction
- **Base Sepolia testnet**: Test environment for USDC token operations

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

## 🎯 Running the Demo

### Basic Wallet Creation Demo

For a simpler introduction to Dynamic wallet creation and gasless transactions, run the basic wallet demo:

```bash
pnpm create-wallet
```

This creates a single wallet with 2-of-2 threshold signatures and executes a basic gasless transaction, serving as a foundation for understanding the omnibus sweep pattern.

### Omnibus Sweep Demo

The omnibus sweep demo creates multiple customer wallets, funds each one, and then transfers all funds to a centralized omnibus account.

**Run with default settings (10 wallets):**

```bash
pnpm omnibus
```

**Run with custom number of wallets:**

```bash
pnpm omnibus 20
```

## 📊 Sample Output

Here's what you'll see when running the demo with 10 wallets:

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
