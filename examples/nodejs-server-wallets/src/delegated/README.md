# Delegated Wallet Examples

These examples demonstrate how to use delegated wallets - wallets where another user has granted your application permission to sign transactions on their behalf.

## Prerequisites

Delegated wallets require a `wallet.json` file containing credentials obtained through a separate delegation process. This is different from server wallets where you control the key shares directly.

### Required: wallet.json

Create a `wallet.json` file in this directory with the following structure:

```json
{
  "address": "0x...",
  "walletId": "wallet-uuid-here",
  "walletApiKey": "api-key-here",
  "delegatedShare": "encrypted-key-share-here"
}
```

See `wallet.json.example` for a template.

### How to Obtain Delegated Access

1. The wallet owner initiates delegation through your frontend application
2. They approve your application to sign on their behalf
3. You receive the delegation credentials (walletId, walletApiKey, delegatedShare)
4. Store these credentials securely for future use

## Available Scripts

### Sign a Message

```bash
pnpm delegated:sign-msg "Hello, World!"
```

### Send a Transaction

```bash
pnpm delegated:send-txn
```

## Security Considerations

- Store delegated credentials securely (encrypted at rest)
- Implement proper access controls
- Monitor and log all delegated operations
- Respect the scope of delegation granted by the user
- Provide users with the ability to revoke delegation

## Comparison: Server Wallets vs Delegated Wallets

| Aspect      | Server Wallets             | Delegated Wallets               |
| ----------- | -------------------------- | ------------------------------- |
| Key Control | You control key shares     | User controls, grants access    |
| Creation    | You create the wallet      | User creates, delegates to you  |
| Use Case    | Treasury, omnibus accounts | User operations on their behalf |
| Revocation  | N/A (you control)          | User can revoke access          |
