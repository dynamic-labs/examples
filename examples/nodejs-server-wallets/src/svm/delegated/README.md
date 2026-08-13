# Delegated Solana Wallet Examples

Wallets where a user has granted your application permission to sign Solana transactions on their behalf.

Transactions here are **gasless**: Dynamic pays the fee, so the user needs no SOL. The transaction still originates from the user's own address — delegation changes who signs, not whose account it is.

## Prerequisites

Requires a `wallet.json` in this directory with delegation credentials for a **Solana** wallet. This is separate from the EVM example's `wallet.json` — an EVM delegation cannot sign Solana transactions.

Gasless sends additionally require gas sponsorship to be enabled for your environment in the [Dynamic Dashboard](https://app.dynamic.xyz). Message signing works without it.

### Required: wallet.json

```json
{
  "address": "<base58 Solana address>",
  "walletId": "wallet-uuid-here",
  "walletApiKey": "api-key-here",
  "delegatedShare": "delegated-key-share-here",
  "shareSetId": "share-set-uuid-here"
}
```

See `wallet.json.example` for a template. `shareSetId` is optional — omit it and Dynamic resolves the correct share set from `walletId`.

> ⚠️ `walletApiKey` and `delegatedShare` together can sign on the user's behalf. `wallet.json` is gitignored, but for anything beyond local testing keep them in a secrets manager rather than on disk.

### How to Obtain Delegated Access

1. The wallet owner initiates delegation through your frontend
2. They approve your application to sign on their behalf
3. Your `wallet.delegation.created` webhook receives the credentials
4. Store them securely

## Available Scripts

```bash
# Off-chain, no sponsorship needed
pnpm svm:delegated:sign-msg "Hello, World!"

# Gasless transaction
pnpm svm:delegated:send-txn
```

## How Gasless Signing Works Here

Solana sponsorship is mechanically simpler than the EVM equivalent — no delegation contract, no signed intent, no relayer. Dynamic swaps the transaction's **fee payer** for its own sponsor account and signs as that fee payer. Your server broadcasts the result.

For a **server wallet**, `signTransaction` can sign the sponsored transaction directly because you hold the key shares. For a **delegated wallet** the two steps split:

1. **Sponsor.** `svmClient.sponsorTransaction({ transaction })` on the API-token client returns the transaction with Dynamic's sponsor as fee payer. No wallet key material is involved.
2. **Sign.** `delegatedSignTransaction(delegatedClient, { transaction: sponsored, signerAddress })` signs with the user's delegated share. `signerAddress` is essential: without it the SDK signs as the fee payer, which is now Dynamic's sponsor — an account you have no authority over.
3. **Broadcast.** Your server submits the fully signed transaction.

**Order matters.** Replacing the fee payer changes the transaction message, and therefore what has to be signed. Sponsoring after signing would invalidate the user's signature.

### Why not a custom fee payer?

Dynamic's docs also describe a "custom fee payer" pattern: your server holds a funded Solana keypair and signs as fee payer alongside the user. These examples deliberately don't do that. Letting Dynamic be the fee payer achieves the same result with **no raw private key** in your environment, which removes a whole class of key-management and funding concerns.

If you do need a custom fee payer — for example to pay fees in SPL tokens — that's the pattern to reach for, but keep the keypair in a KMS or HSM rather than an environment variable.

## Comparison: EVM vs SVM Sponsorship

| Aspect            | EVM                                  | SVM                                |
| ----------------- | ------------------------------------ | ---------------------------------- |
| Mechanism         | EIP-7702 delegation + signed intent  | Fee payer replacement              |
| One-time setup    | EIP-7702 authorization per wallet    | None                               |
| Who broadcasts    | Dynamic's relayer                    | Your server                        |
| RPC required      | For delegation checks / nonces       | For blockhash and broadcasting     |
| Sender address    | Unchanged (wallet's own EOA)         | Unchanged (fee payer differs)      |
| Signature type    | ECDSA (hex)                          | Ed25519 (base58)                   |

## Security Considerations

- Store delegated credentials in a secrets manager, encrypted at rest
- Implement proper access controls and audit logging
- Respect the scope of delegation granted by the user
- Provide users with the ability to revoke delegation (`revokeDelegation`)
- Validate the instructions you sponsor — sponsorship means you pay for whatever the transaction does
