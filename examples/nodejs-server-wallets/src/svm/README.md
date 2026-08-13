# Solana Server Wallet Examples

Single-operation examples for Solana server wallets — wallets your application owns and holds key shares for. For wallets a *user* has delegated to you, see [`delegated/`](delegated).

Default cluster is devnet (`SOLANA_RPC_URL`, `SOLANA_CLUSTER`).

| Example | Command |
| --- | --- |
| [Wallet management](#wallet-management) | `pnpm svm:wallet` |
| [Send transaction](#send-transaction) | `pnpm svm:send-txn` |
| [Sign message](#sign-message) | `pnpm svm:sign-msg` |

---

## How Solana sponsorship differs from EVM

Worth reading before the examples — it is not the EVM model with different names.

| | EVM | SVM |
| --- | --- | --- |
| Mechanism | EIP-7702 delegation + signed intent | **Fee payer replacement** |
| One-time setup | 7702 authorization per wallet | None |
| Who broadcasts | Dynamic's relayer | **Your server** |
| Signatures | ECDSA (hex) | Ed25519 (base58) |

Dynamic swaps the transaction's fee payer for its own sponsor account and signs as that payer; your server then adds the wallet's signature and submits it. Because replacing the fee payer changes the message being signed, **sponsorship must happen before signing**.

Two consequences that bite in practice:

- Transactions are built as **v0 `VersionedTransaction`**, because Dynamic's sponsorship endpoint always returns versioned — building v0 keeps the type stable end to end. (Legacy `Transaction` inputs also work as of SDK 1.0.105; on 1.0.101 and earlier they threw.)
- Blockhashes are fetched at **`finalized`**, not `confirmed`. Sponsorship plus MPC signing adds round trips, and public RPC is load-balanced, so a just-confirmed blockhash may be unknown to whichever node simulates the transaction.

---

## Wallet management

`wallet.ts` — create, list, and delete Solana server wallets.

```bash
pnpm svm:wallet --create                                    # ephemeral, not saved
pnpm svm:wallet --create --save                              # persist for reuse
pnpm svm:wallet --create --save --threshold 3                # 2-of-3 instead of 2-of-2
pnpm svm:wallet --create --save --backup --password secret   # shares backed up to Dynamic
pnpm svm:wallet --list                                       # also shows SOL balance
pnpm svm:wallet --delete <base58-address>
```

Flags match the EVM script; `--backup` likewise requires `--password`. `--list` filters to SVM wallets and includes each balance, which is the first thing you want when a `standard` send fails.

---

## Send transaction

`send-transaction.ts` — a 0-lamport self-transfer, either paying the fee or having Dynamic sponsor it.

```bash
pnpm svm:send-txn standard                              # wallet pays the fee
pnpm svm:send-txn gasless                               # Dynamic sponsors
pnpm svm:send-txn gasless --address <base58>
pnpm svm:send-txn gasless --order-id order-1            # idempotent: safe to retry
```

| Mode | Needs |
| --- | --- |
| `standard` | Devnet SOL in the wallet |
| `gasless` | Gas sponsorship enabled for your environment |

A 0-lamport self-transfer moves nothing but still requires the wallet's signature, which is exactly what demonstrates who paid the fee. Verified on devnet: a wallet holding **zero SOL** transacted successfully while Dynamic's sponsor paid 10,000 lamports.

### `--order-id` works differently here

On EVM you pin a nonce. There is no nonce on Solana, and **rebuilding takes a fresh blockhash** — a new message, so a new transaction id, so a second execution. (Re-signing alone is deduped when sponsored, because the id is the sponsor's signature; see [IDEMPOTENCY.md](../../IDEMPOTENCY.md).) So the safe unit is the signed bytes:

1. Sign once, persist the serialized bytes.
2. On retry, rebroadcast **those exact bytes**. Solana dedups identical signatures, so it cannot execute twice.
3. Never rebuild — a fresh blockhash means a new transaction id.

The retry window is bounded by blockhash validity (~60–90s); past that the transaction is permanently dead and a retry must rebuild, which needs an application-level guard. See [IDEMPOTENCY.md](../../IDEMPOTENCY.md).

---

## Sign message

`sign-message.ts` — Ed25519 signing, returned base58-encoded (the Solana convention, unlike hex on EVM). Off-chain, no sponsorship needed.

```bash
pnpm svm:sign-msg "Hello, World!"
pnpm svm:sign-msg "Hello, World!" --address <base58>
pnpm svm:sign-msg "Hello, World!" --address <base58> --password secret
```

There is no SVM equivalent of `sign-typed-data` — EIP-712 is EVM-specific.
