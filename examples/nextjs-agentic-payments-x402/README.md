# Agentic payments with Dynamic + x402 (crypto, abstracted)

A production-shaped demo of **agentic payments that hide all the crypto**. A user
signs in, "adds funds" in USD (via a MoonPay card top-up), and authorizes an
agent. The agent then **pays for services on the user's behalf** using
[x402](https://x402.org) — gasless USDC payments signed inside Dynamic's MPC, so
no private keys ever touch the agent and the user never sees a seed phrase, gas
fee, or token symbol.

> "Stablecoins between agents, on existing rails": the user experience is a
> dollar balance and a card top-up; the settlement layer is stablecoins over HTTP 402.

Built on the **Dynamic JS SDK** (`@dynamic-labs-sdk/*` + react-hooks), like
`nextjs-stablecoin-yield-aave`.

## What's in the box

| Piece | Path | Role |
| --- | --- | --- |
| **Website** | `app/`, `components/flow/`, `lib/providers.tsx` | Email sign-in → embedded wallet (guarded) → authorize → fund. USD-framed, light theme. |
| **Delegation webhook** | `app/api/webhooks/dynamic/`, `lib/dynamic/` | Verifies + receives `wallet.delegation.created`, decrypts the share (RSA-OAEP + AES-GCM). |
| **Encrypted store** | `lib/shared/delegation-store.ts`, `supabase/` | Re-encrypts shares (AES-256-GCM, server master key) into Supabase. |
| **Balance API** | `app/api/balance/` | The wallet's USD balance for the UI. |
| **Owner approval** | `app/authorize/`, `app/api/agent-grant/`, `lib/shared/agent-grants.ts` | Self-hosted device-grant: the owner approves an agent run by signing in here; verified against their Dynamic JWT. |
| **Paid service** | `app/api/services/azure-compute/`, `lib/shared/x402-server.ts` | An "Azure-style" resource gated behind x402 v2 (`withX402`), priced in USD. |
| **Agent** | `agent/pay-for-service.ts` | Resolves a wallet **by address**, gets the owner's approval via the device-grant, then pays the service via x402 (gasless). |

## How it works

```
                    Website (Dynamic JS SDK)
  user ──email sign-in──▶ embedded EVM wallet ──authorize──▶ delegateWaasKeyShares
                                                              │
                          Dynamic webhook (wallet.delegation.created)
                                                              │  RSA-decrypt
                                                              ▼  AES-256-GCM encrypt
                                                       Supabase (encrypted share)
                                                              │
   agent <walletAddress> ─────────────────────────────────────┘
     │   check USD balance ──(empty)──▶ point user to funding page
     │   pay x402 service  ──sign EIP-3009 via Dynamic MPC (gasless)──▶ facilitator settles USDC
     ▼
   "Azure compute unit provisioned. Charged $0.01."
```

The agent never holds a key. x402 v2's `exact` scheme only needs an EIP-712
signature, so `lib/shared/x402-account.ts` exposes a minimal signer (`address` +
`signTypedData`) that routes `signTypedData` to Dynamic's `delegatedSignTypedData`
and registers it on an `x402Client` via `ExactEvmScheme`.

**User ↔ wallet mapping.** The agent is told which wallet to act for by its
**address** (shown on the funding page): `pnpm agent <walletAddress>`. The address
is public and non-secret — it only selects which wallet to request; acting on it
requires the owner's approval (below).

**Owner approval (self-hosted device grant).** Before acting, the agent starts a
grant and prints a link to **this app's** `/authorize?code=XXXX-XXXX`. The wallet
owner opens it, signs in with Dynamic, and approves; the server verifies their
**Dynamic session JWT** owns that wallet (`lib/dynamic/auth.ts`) before flipping
the grant to `approved`. The agent polls until then. So knowing the public address
authorizes nothing — only the owner, proven by their Dynamic login, can.

```
   pnpm agent <addr> ──POST /api/agent-grant──▶ user_code + grant_code
        │                                          │
        │  print  …/authorize?code=XXXX-XXXX  ◀────┘
        │                                       owner opens, signs in (Dynamic),
        │                                       approves → /api/agent-grant/approve
        │                                       verifies JWT owns the wallet
        └──poll /api/agent-grant?grant_code=…──▶ approved → agent pays via x402
```

## Network

Hardcoded to **Base Sepolia** (testnet) in `lib/shared/constants.ts` — single
network, no switching. Payments settle through the **public x402 facilitator**
(`https://x402.org/facilitator`), which sponsors testnet settlement for free, so
**no facilitator API keys are needed**.

## Setup

1. **Install**: `pnpm install`

2. **Dynamic** ([dashboard](https://app.dynamic.xyz), use a **live** env for prod):
   - Enable embedded wallets + delegated access + email login.
   - Create an API token.
   - Generate the delegation keypair, upload the **public** key (delegated-access encryption key):
     ```bash
     openssl genrsa -out private-key.pem 3072
     openssl rsa -in private-key.pem -pubout -out public-key.pem
     ```
   - Add a webhook → `https://<your-domain>/api/webhooks/dynamic`, events
     `wallet.delegation.created` + `wallet.delegation.revoked`; copy the signing secret.

3. **Supabase**: create a project, run migrations, grab the URL + service-role key:
   ```bash
   supabase db push --db-url "$SUPABASE_DB_URL"   # applies supabase/migrations/*
   ```

4. **Env**: `cp .env.example .env` and fill it in.
   ```bash
   openssl rand -hex 32   # → DELEGATION_ENCRYPTION_KEY
   ```

5. **Run**: `pnpm dev` → http://localhost:3000

## Demo flow

1. **Sign in** with email (embedded wallet created silently, guarded so it's never duplicated).
2. **Authorize your agent** — delegated access; the webhook stores the encrypted share in Supabase.
3. **Add funds** — MoonPay card top-up (signed URL via the Dynamic SDK's `getMoonPayUrl`). Balance shows in USD. Note your **wallet address**.
4. **Run the agent** for that wallet:
   ```bash
   pnpm agent <walletAddress>
   ```
   ```
   Wallet 0x…
   🔐 Approve this agent to act on your wallet:
      https://…/authorize?code=ABCD-EFGH
   ⏳ Waiting for approval…
   ```
5. **Approve** — open the printed link, sign in as the wallet owner, click **Approve**. The agent then continues:
   ```
   ✅ Approved.
   Balance: $25.00
   💳 Paying for service: …/api/services/azure-compute
   ✅ Service delivered (paid $0.01): { status: "provisioned", … }
   ```
   No binding yet → the agent prints the onboarding steps instead.

## Deploy (Vercel)

```bash
vercel link        # link the project
# set the env vars from .env in the Vercel dashboard (or `vercel env add` each)
vercel --prod
```
Then:
- **Disable Deployment Protection** for production (Project Settings → Deployment
  Protection → Vercel Authentication → off) so the site is public and the webhook
  endpoint is reachable.
- Point the Dynamic webhook at `https://<your-vercel-domain>/api/webhooks/dynamic`.
- Set `FUNDING_URL` / `X402_SERVICE_URL` to the deployed domain. Run the agent
  from any server with the same env (it talks to Supabase + the deployed service).

> **npm registry:** the Dynamic JS SDK is pinned to **1.8.0** (needed for
> `getMoonPayUrl`). Some 1.8.0 packages live only on Dynamic's internal registry,
> so a CI/Vercel build needs that registry's auth token (`.npmrc` / `NPM_RC`).

## Security notes

- **No plaintext key material at rest.** Shares arrive RSA-encrypted from Dynamic,
  are decrypted server-side, then re-encrypted with AES-256-GCM
  (`DELEGATION_ENCRYPTION_KEY`) before Supabase. The table has RLS on with no
  public policies — only the service-role key reads it.
- **Owner-approved actions.** The agent can't act until the wallet owner approves
  the run at `/authorize`, verified against their Dynamic session JWT + wallet
  ownership (`lib/dynamic/auth.ts`). The grant's poll secret is stored only as a
  SHA-256 hash; grants expire after 15 minutes.
- **No raw keys in the agent.** All signing is inside Dynamic's MPC.
- **Gasless.** x402 payments are EIP-3009 `transferWithAuthorization` — the
  facilitator pays gas; the user pays only the stablecoin amount.
- **Webhook auth.** Incoming webhooks are signature-verified (`DYNAMIC_WEBHOOK_SECRET`).
- **Secrets via env only.** `.env*` and `*.pem` are gitignored. For production,
  prefer a KMS/HSM for the RSA + at-rest keys and decrypt on demand; rotate keys;
  use the Dynamic **live** env and least-privilege Supabase access.
- Revocation: `wallet.delegation.revoked` deletes the stored share, so the agent
  can no longer act.
