# Delegated Wallet Examples

These examples demonstrate how to use delegated wallets - wallets where another user has granted your application permission to sign transactions on their behalf.

Transactions here are **gasless**: gas is sponsored by Dynamic, so the user never needs a native token balance. The transaction still originates from the user's own address — delegation changes who signs, not whose account it is.

## Prerequisites

Delegated wallets require a `wallet.json` file containing credentials obtained through a separate delegation process. This is different from server wallets where you control the key shares directly.

Gasless transactions additionally require **EVM Gas Sponsorship**, an enterprise feature. Enable it in the [Dynamic Dashboard](https://app.dynamic.xyz) under **Settings → Embedded Wallets**, and make sure the chain you're using is enabled. Message signing works without it.

### Required: wallet.json

Create a `wallet.json` file in this directory with the following structure:

```json
{
  "address": "0x...",
  "walletId": "wallet-uuid-here",
  "walletApiKey": "api-key-here",
  "delegatedShare": "delegated-key-share-here",
  "shareSetId": "share-set-uuid-here"
}
```

See `wallet.json.example` for a template.

`shareSetId` is optional — omit it and Dynamic resolves the correct share set from `walletId`. When you do supply it, use the `shareSetId` from the `wallet.delegation.created` webhook payload, not `keyShares[].id` from a `byWalletAddress` lookup (those are different primary keys).

> ⚠️ `walletApiKey` and `delegatedShare` are credentials that together can sign on the user's behalf. `wallet.json` is gitignored, but for anything beyond local testing keep them in a secrets manager (Vault, AWS/GCP Secret Manager) rather than on disk.

### How to Obtain Delegated Access

1. The wallet owner initiates delegation through your frontend application
2. They approve your application to sign on their behalf
3. Your `wallet.delegation.created` webhook receives the delegation credentials (`walletId`, `walletApiKey`, key share, `shareSetId`)
4. Store these credentials securely for future use

## Available Scripts

### Sign a Message

```bash
pnpm evm:delegated:sign-msg "Hello, World!"
```

### Send a Gasless Transaction

```bash
pnpm evm:delegated:send-txn
```

### Sign Now, Relay Later

```bash
pnpm evm:delegated:send-txn --pre-sign
```

Stops after signing, prints the intent as plain JSON, then relays it. The two
halves are genuinely separable: signing needs the delegated credentials, relaying
needs only your environment API token, and the payload can travel between them as
JSON at any point inside `validForSeconds` (10 minutes by default).

This is the **only** route to that split for a delegated wallet — the SDK's own
`signSponsoredTransaction` signs with caller-held key shares, which a delegated
wallet by definition does not have. The payload's field set is identical to that
function's output, so the relay accepts either interchangeably.

## How Gasless Signing Works Here

For a **server wallet** you hold the key shares, so the SDK's `sendSponsoredTransaction` signs the sponsorship intent for you in one call.

A **delegated wallet's** share stays with Dynamic behind a wallet-scoped API key, so the SDK cannot sign the intent from caller-held shares. `src/lib/gasless/evm.ts` therefore assembles the intent explicitly:

1. Look up an available relayer for the chain (`getAvailableEvmGaslessRelayer`) — the relayer address is signed into the intent, so it has to be resolved first.
2. If the wallet isn't delegated yet, sign the one-time EIP-7702 authorization with `delegatedSignAuthorization`. This persists on-chain and is reused afterwards.
3. Sign the EIP-712 `AuthorizedExecutions` intent with `delegatedSignTypedData`, using the SDK's exported `AUTHORIZED_EXECUTIONS_TYPES`, `BATCH_CALL_OPDATA_AUTH_MODE`, and `DELEGATION_CONTRACT_ADDRESS`.
4. Relay the finished payload with `sendSponsoredTransaction({ signedTransaction })`, which needs only your environment API token — no wallet key material.

Steps 3–4 are the same "sign in one process, relay from another" split the SDK supports natively; only the signing primitive differs.

> ⚠️ Because there is no first-class delegated sponsorship API, this path depends on the intent structure the SDK builds internally. The constants are imported from the SDK rather than copied, so a change to the delegate contract or mode is picked up automatically — but a change to the intent's *shape* would need this code updated.

## Security Considerations

- Store delegated credentials securely (encrypted at rest, in a secrets manager)
- Implement proper access controls
- Monitor and log all delegated operations
- Respect the scope of delegation granted by the user
- Provide users with the ability to revoke delegation (`revokeDelegation`)
- Sponsorship intents are valid for 10 minutes by default; shorten with `validForSeconds` if you pre-sign and relay later

## Comparison: Server Wallets vs Delegated Wallets

| Aspect          | Server Wallets                    | Delegated Wallets                       |
| --------------- | --------------------------------- | --------------------------------------- |
| Key Control     | You control key shares            | User controls, grants access            |
| Creation        | You create the wallet             | User creates, delegates to you          |
| Use Case        | Treasury, omnibus accounts        | User operations on their behalf         |
| Revocation      | N/A (you control)                 | User can revoke access                  |
| Gasless signing | Built in (`walletMetadata`+shares) | Intent signed via delegated credentials |
