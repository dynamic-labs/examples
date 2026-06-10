# Bare-bones LangGraph agent + Dynamic delegated wallet

A minimal [LangGraph](https://github.com/langchain-ai/langgraphjs) ReAct agent that
acts on a user's wallet through a **Dynamic delegated MPC wallet**. The user grants
the agent signing access in the Dynamic SDK; the agent signs and broadcasts
transactions server-side via Dynamic's MPC — no private keys are ever held by the agent.

It ships three tools:

| Tool | What it does |
| --- | --- |
| `list_wallets` | Returns the delegated wallet address. |
| `get_token_balances` | Multi-chain balances via Dynamic's balances API (optional USD prices). |
| `send_transaction` | Native transfer, signed via Dynamic MPC. **Always** gated behind a `y/N` confirm prompt. |

## How it works

```
You ──▶ LangGraph ReAct agent (Claude) ──▶ tools ──▶ Dynamic MPC signing ──▶ chain
```

- **`src/wallet.ts`** — loads delegation credentials from env, creates the Dynamic
  delegated EVM client, and signs + broadcasts transactions.
- **`src/tools.ts`** — the three LangChain tools above.
- **`src/agent.ts`** — the `createReactAgent` loop (Claude Haiku 4.5) + system prompt.
- **`src/index.ts`** — an interactive terminal REPL.
- **`src/confirm.ts`** — the confirmation prompt for sensitive actions.

## Setup

1. Install dependencies (this repo uses pnpm):

   ```bash
   pnpm install
   ```

2. Create your env file from the example and fill it in:

   ```bash
   cp .example.env .env
   ```

   | Variable | Purpose |
   | --- | --- |
   | `ANTHROPIC_API_KEY` | Drives the agent. |
   | `DYNAMIC_ENVIRONMENT_ID`, `DYNAMIC_API_KEY` | Dynamic env for delegated signing. |
   | `DYNAMIC_USER_JWT` | Required by `get_token_balances` (Dynamic balances API). |
   | `DELEGATED_WALLET_ID`, `DELEGATED_WALLET_ADDRESS`, `DELEGATED_WALLET_API_KEY`, `DELEGATED_KEY_SHARE` | Pre-decrypted delegation credentials. |

   The delegation credentials come from the user approving delegation in the Dynamic
   SDK (client-side), delivered to your server via Dynamic's webhook. For local dev you
   can paste the pre-decrypted values into `.env`.

   > **Never commit `.env` or real credentials.** `.env*` is gitignored; only
   > `.example.env` (placeholders) is tracked.

3. Run it:

   ```bash
   pnpm start        # or: pnpm dev  (watch mode)
   ```

   ```
   You: show my wallet
   Agent: Your delegated wallet is 0x1234…abcd.

   You: send 0.001 ETH on ethereum to 0xabc…
   ┌─ ACTION REQUIRED ────────────────────────────────────────
   │  Send native transfer
   │    Chain:  Ethereum (1)
   │    To:     0xabc…
   │    Amount: 0.001 ETH
   └──────────────────────────────────────────────────────────
   Proceed? [y/N]
   ```

## Notes

- **Mainnet only.** Supported chains: Ethereum (1), Polygon (137), Base (8453),
  Arbitrum (42161), Optimism (10), BSC (56). Extend `CHAIN_MAP` in `src/wallet.ts`.
- `send_transaction` only does native transfers. To add ERC-20 transfers or contract
  calls, build the calldata and extend `sendTransactionDelegated`.
- Conversation memory is in-process (`MemorySaver`) and resets on restart.

This is a trimmed-down version of the full `langgraph-dynamic-agent` (which adds
Polymarket betting, LI.FI cross-chain swaps, and voice).
