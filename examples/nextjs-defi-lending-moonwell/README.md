# Earn yield by lending on Moonwell

Supply and withdraw USDC on [Moonwell](https://moonwell.fi) (Base) using a Dynamic
embedded wallet. Built with the Dynamic JavaScript SDK — headless email OTP
sign-in, an automatically created WaaS wallet, and viem for the contract calls.

## What this example shows

- **Headless email OTP login** with `useSendEmailOTP` / `useVerifyOTP` — the JS SDK
  ships no modal, so the sign-in form is yours
- **WaaS wallet bootstrap** on `userChanged`, using
  `getChainsMissingWaasWalletAccounts()` rather than an account-count guard
- **Live market data** from `https://api.moonwell.fi/v1/markets?chainId=8453`,
  with deprecated markets filtered out
- **Supply and withdraw USDC** through Moonwell's mToken (a Compound v2 fork):
  `approve` → `mint`, and `redeemUnderlying` / `redeem`
- **Compound v2 error codes** — every write simulates first and asserts the
  returned code is `0`, because these contracts answer some failures with a
  return value instead of a revert

Every market has a detail page with live rates. Supply and withdraw are wired up
for the USDC market only — the others are read-only.

## Setup

### 1. Dynamic dashboard

In [app.dynamic.xyz](https://app.dynamic.xyz):

- Enable **Base** under _Chains & Networks_
- Enable **Embedded wallets** under _Wallets_
- Enable **Email** under _Sign-in Methods_
- Add `http://localhost:3000` under _Security → Allowed Origins_
- Copy your environment ID from _Developer Settings → SDK & API Keys_

Optionally toggle **Show Confirmation UI** and **Transaction Simulation** under
_Developer Settings → Embedded Wallets → Dynamic_ for a transaction preview.

### 2. Environment

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_DYNAMIC_ENV_ID=your-environment-id
```

Reads and broadcasts go through `https://rpc.moonwell.fi/main/evm/8453` by
default. Set `NEXT_PUBLIC_BASE_RPC_URL` to use your own provider. Base's public
endpoint (`mainnet.base.org`) is a poor choice here — it rate-limits browser
traffic and answers with 403, which shows up as a failed broadcast.

### 3. Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). To move real funds you need
USDC and a little ETH for gas on Base.

## Scripts

| Command          | What it does                        |
| ---------------- | ----------------------------------- |
| `pnpm dev`       | Dev server on port 3000             |
| `pnpm build`     | Production build                    |
| `pnpm typecheck` | `tsc --noEmit`                      |
| `pnpm lint`      | ESLint                              |

## Project structure

```
src/
  app/
    lend/
      page.tsx            # market list with live APYs
      [mToken]/page.tsx   # any market's rates; supply/withdraw for USDC
  components/
    Login.tsx             # headless email OTP form
    MarketRow.tsx
    BalanceDisplay.tsx
    SupplyWithdrawForm.tsx
    ui/                   # Badge, TokenIcon, Skeleton
  lib/
    dynamic.ts            # client + addEvmExtension() + initializeClient()
    providers.tsx         # QueryClientProvider > DynamicProvider > WaasBootstrap
    constants.ts          # chain, API URL, USDC + mUSDC addresses
    moonwell.ts           # pure API parsing + mToken math (unit tested)
    utils.ts              # error formatting + retry predicate (unit tested)
    viem.ts               # read-only Base public client
    ABIs/                 # ERC20 + minimal mToken
    hooks/
      useMarkets.ts
      useBalances.ts
      useLendingOperations.ts
```

## Notes

- **Base only.** There is no network selector; `CHAIN_ID` is fixed to `8453`.
- **Two markets report the `mUSDC` symbol** — native USDC and the deprecated
  USDbC market. Markets are always keyed by `mTokenAddress`, never by symbol.
- **Supplied balance is derived**, not read: an mToken balance stays constant
  while `exchangeRateStored` grows, so interest only appears once you compute
  `mTokenBalance * exchangeRateStored / 1e18`.

## Resources

- [Dynamic JS SDK quickstart](https://docs.dynamic.xyz/javascript/reference/quickstart)
- [Moonwell documentation](https://docs.moonwell.fi)
- [Moonwell markets API](https://api.moonwell.fi/v1/markets)
