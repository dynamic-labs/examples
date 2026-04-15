# Kamino Earn with Dynamic

A Next.js application that demonstrates how to integrate [Kamino Finance](https://kamino.finance) Earn vaults on Solana using [Dynamic](https://dynamic.xyz) for embedded wallet management.

## What This Example Shows

- Connect a Solana wallet via Dynamic's embedded wallet SDK
- Browse all Kamino Earn vaults with live APY and TVL data
- Deposit tokens into any Kamino Earn vault
- View your active positions and earned yield
- Withdraw your shares from vaults

## How It Works

### Wallet Integration

This example uses Dynamic's `SolanaWalletConnectors` — no EVM/wagmi setup needed. Users can connect with Phantom, Solflare, or Dynamic's embedded wallet:

```tsx
// src/lib/providers.tsx
import { SolanaWalletConnectors } from "@dynamic-labs/solana";

<DynamicContextProvider settings={{ walletConnectors: [SolanaWalletConnectors] }}>
```

### Vault Data

Vault listings, APY, and TVL are fetched from [Kamino's public API](https://api.kamino.finance):

- `GET /kvaults/vaults` — all available vaults
- `GET /kvaults/vaults/{pubkey}/metrics` — APY and TVL per vault
- `GET /kvaults/users/{pubkey}/positions` — user's active positions

### Transactions (Deposit / Withdraw)

Transactions are built using `@kamino-finance/klend-sdk` and `@solana/kit`, then signed with the Dynamic wallet:

```typescript
import { KaminoVault } from "@kamino-finance/klend-sdk";
import { createSolanaRpc, createNoopSigner, address, pipe, ... } from "@solana/kit";
import { Decimal } from "decimal.js";

// 1. Use the Kamino SDK to build deposit instructions.
//    createNoopSigner provides the wallet address for account derivation
//    without signing at this stage.
const rpc = createSolanaRpc(SOLANA_RPC_URL);
const vault = new KaminoVault(rpc, address(vaultAddress));
const noopSigner = createNoopSigner(address(walletAddress));
const depositIxs = await vault.depositIxs(noopSigner, new Decimal(amount));

// 2. Assemble a versioned transaction with @solana/kit
const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(noopSigner, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(depositIxs, tx)
);
const compiled = await partiallySignTransactionMessageWithSigners(transactionMessage);

// 3. Bridge to @solana/web3.js v1 VersionedTransaction for Dynamic signing
const wireBase64 = getBase64EncodedWireTransaction(compiled);
const versionedTx = VersionedTransaction.deserialize(Buffer.from(wireBase64, "base64"));

// 4. Sign with Dynamic's Solana wallet
const signer = await primaryWallet.getSigner();
const signedTx = await signer.signTransaction(versionedTx);

// 5. Send to Solana
const connection = new Connection(SOLANA_RPC_URL);
const txHash = await connection.sendRawTransaction(signedTx.serialize());
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Get your environment ID from https://app.dynamic.xyz
NEXT_PUBLIC_DYNAMIC_ENV_ID=your-environment-id

# Optional: Use a custom Solana RPC endpoint
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # App layout with providers
│   └── page.tsx            # Main page
├── components/
│   ├── VaultsInterface.tsx # Main interface (vault list + positions)
│   ├── VaultCard.tsx       # Individual vault with deposit/withdraw
│   ├── PositionCard.tsx    # User position display
│   └── ...                 # Header, footer, UI components
└── lib/
    ├── kamino.ts           # Kamino API functions
    ├── providers.tsx       # Dynamic + TanStack Query setup
    ├── types.ts            # TypeScript types
    ├── useVaultOperations.ts # Deposit/withdraw hook
    └── utils.ts            # Token info, formatters
```

## Key Packages

| Package | Purpose |
|---|---|
| `@dynamic-labs/sdk-react-core` | Dynamic wallet UI and context |
| `@dynamic-labs/solana` | Solana wallet connectors for Dynamic |
| `@kamino-finance/klend-sdk` | Kamino SDK — builds deposit/withdraw instructions |
| `@solana/kit` | Transaction construction (used by Kamino SDK) |
| `@solana/web3.js` | Bridge for signing with Dynamic + RPC send |
| `decimal.js` | Token amount handling (required by Kamino SDK) |
| `@tanstack/react-query` | Data fetching and caching |

## Resources

- [Dynamic Docs](https://docs.dynamic.xyz)
- [Kamino Finance Docs](https://kamino.finance/docs)
- [Kamino API Reference](https://api-docs.kamino.com)
- [Kamino SDK (klend-sdk)](https://www.npmjs.com/package/@kamino-finance/klend-sdk)
- [Dynamic Dashboard](https://app.dynamic.xyz)
