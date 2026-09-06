# Aleo private payments

Send shielded ALEO credits from a Dynamic embedded wallet, using the JavaScript SDK and React hooks.

Companion app for the [Private payments on Aleo](https://docs.dynamic.xyz/recipes/chains/aleo-private-payments) recipe.

## What it does

1. Email OTP sign-in, fully headless (no Dynamic modal)
2. An embedded Aleo MPC wallet is created right after login
3. Shows both halves of an Aleo balance: private records and the public account balance
4. Sends credits privately with `credits.aleo/transfer_private`
5. Links the resulting transaction on the Provable explorer

Keys never leave Dynamic's wallet infrastructure, and proof generation happens there too.

## How an Aleo balance works

Aleo has two balances and this example shows both, because they behave differently:

- **Public balance** lives in the `credits.aleo` `account` mapping. Any RPC can read it, which is what `getNativeBalance` (`useGetNativeBalance`) does.
- **Private balance** is the sum of the wallet's own encrypted **records**. Only the owner's view key can read them, so they come from the wallet itself through `requestRecords`.

A private send spends **one** input record. That is the single most surprising constraint of the model: a wallet holding 0.6 and 0.5 credits in two records cannot send 1 credit, even though the total is enough. The send form surfaces that case instead of failing with a proving error. Record merging (`joinRecords`) is not available in the JavaScript SDK yet.

## Setup

### Dashboard configuration

In the [Dynamic dashboard](https://app.dynamic.xyz):

1. Enable **Aleo** under **Chains & Networks**
2. Enable **Embedded wallets** under **Wallets**
3. Enable **Email** under **Sign-in Methods**
4. Add your app's origin under **Security → Allowed Origins**

### Run locally

```bash
git clone https://github.com/dynamic-labs-oss/examples.git
cd examples/examples/nextjs-aleo-private-payments
cp .env.example .env.local
# add your environment ID to .env.local
pnpm install
pnpm dev
```

Then `pnpm test` for the unit tests, `pnpm lint` and `pnpm typecheck`.

## Key files

| File | What it shows |
| --- | --- |
| `src/lib/dynamic.ts` | `createDynamicClient` plus `addWaasAleoExtension()` |
| `src/lib/providers.tsx` | `DynamicProvider` inside `QueryClientProvider`, and embedded wallet creation on `userChanged` |
| `src/lib/transfers.ts` | Listing private records and sending with `transfer_private` |
| `src/lib/aleo.ts` | Credits and microcredits maths, record parsing, input record selection |
| `src/components/Balances.tsx` | Private (records) and public (`useGetNativeBalance`) balances |
| `src/components/SendForm.tsx` | Send flow and the explorer link from `getAleoExplorerTxUrl` |

## SDK surface used

Everything here is public API in `@dynamic-labs-sdk/*` 1.31.1:

- `@dynamic-labs-sdk/client`: `createDynamicClient`, `initializeClient`
- `@dynamic-labs-sdk/client/core`: `getWalletProviderFromWalletAccount`
- `@dynamic-labs-sdk/client/waas`: `getChainsMissingWaasWalletAccounts`, `createWaasWalletAccounts`
- `@dynamic-labs-sdk/aleo`: `isAleoWalletAccount`, `isAleoWalletProvider`, `getAleoExplorerTxUrl`, `MICROCREDITS_PER_CREDIT`
- `@dynamic-labs-sdk/aleo/waas`: `addWaasAleoExtension`
- `@dynamic-labs-sdk/react-hooks`: `useUser`, `useLogout`, `useSendEmailOTP`, `useVerifyOTP`, `useGetWalletAccounts`, `useGetNativeBalance`, `useOnEvent`

The chain-agnostic `transferAmount` is **not** implemented for Aleo: the Aleo wallet provider exposes `requestTransaction` and `requestRecords` instead, which is what `src/lib/transfers.ts` uses. External Aleo wallets (Leo, Puzzle) work through the same two calls after registering `addAleoWalletStandardExtension()` from `@dynamic-labs-sdk/aleo/walletStandard`.

## Learn more

- [Private payments on Aleo recipe](https://docs.dynamic.xyz/recipes/chains/aleo-private-payments)
- [JavaScript SDK React quickstart](https://docs.dynamic.xyz/javascript/reference/react-quickstart)
