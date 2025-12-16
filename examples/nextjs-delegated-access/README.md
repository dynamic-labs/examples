# Dynamic Delegated Access Example

A Next.js demo showcasing how to build delegated wallet access with Dynamic's webhook system, including secure encryption/decryption of delegation shares.

## What is Delegated Access?

Delegated Access allows your application to act on behalf of a user's wallet. When a user approves delegation, you receive:

- **Delegated share** - An encrypted MPC key share for signing operations
- **Per-wallet API key** - A scoped API key for that specific wallet

This enables server-side automation (bots, agents, recurring jobs) while keeping users in full control. Users can revoke delegation at any time.

**Limitations:** Delegated access only permits signing operations. It does not allow exporting private keys, refreshing/resharing, or modifying wallet policies.

## What This Demo Does

This application demonstrates:

- **Webhook integration** - Receive and process Dynamic delegation webhooks (created and revoked events)
- **Secure decryption** - Decrypt delegation shares using RSA-OAEP + AES-GCM hybrid encryption
- **Share storage** - Store decrypted shares in Redis for delegated operations
- **Server-side signing** - Sign messages using delegated wallet shares
- **Production guidance** - Learn best practices for production deployments with KMS and encrypted storage

## Key Features

- **Webhook handling** - Process `wallet.delegation.created` and `wallet.delegation.revoked` events
- **Hybrid decryption** - RSA-OAEP for key exchange, AES-256-GCM for data encryption
- **Redis storage** - Supports Vercel KV (production) and local Redis (development)
- **Delegated signing** - Sign messages server-side using stored delegation shares

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure Next.js for server-side signing

The Dynamic node packages must be configured as external packages in `next.config.ts` to work correctly with server-side signing:

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@dynamic-labs-wallet/node",
    "@dynamic-labs-wallet/node-evm",
  ],
};
```

This prevents Next.js from bundling these packages, which is required for the native crypto operations used in delegated signing.

### 3. Start Redis (for local development)

This demo uses Redis to store delegation shares. For local development:

```bash
# macOS
brew install redis
redis-server

# Linux
sudo apt-get install redis-server
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis
```

The app automatically connects to `redis://localhost:6379` when no Vercel KV credentials are configured.

### 4. Generate RSA keypair

```bash
# Generate private key (3072-bit RSA)
openssl genrsa -out private-key.pem 3072

# Extract public key
openssl rsa -in private-key.pem -pubout -out public-key.pem
```

### 5. Configure environment variables

```bash
# Copy the example file
cp .env.example .env.local
```

Required environment variables:

```bash
# Dynamic Environment ID (from dashboard)
NEXT_PUBLIC_DYNAMIC_ENV_ID=your_env_id_here

# Webhook secret (from Dynamic dashboard → Webhooks)
DYNAMIC_WEBHOOK_SECRET=your_webhook_secret_here

# API token (from Dynamic dashboard → API)
DYNAMIC_API_TOKEN=your_api_token_here

# Private key for decryption (copy contents of private-key.pem)
DYNAMIC_DELEGATION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"
```

Optional Redis configuration (defaults to local Redis if not set):

```bash
# For Vercel KV (production)
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_vercel_kv_token

# Or for custom Redis instance
KV_URL=redis://your-redis-host:6379
```

### 6. Configure Dynamic Dashboard

1. Go to your [Dynamic dashboard](https://app.dynamic.xyz)
2. Navigate to **Embedded Wallets → Delegated Access**
3. Enable Delegated Access and configure defaults
4. Upload your `public-key.pem` file
5. Register your webhook endpoint URL (e.g., `https://your-domain.com/api/webhooks/dynamic`)

The webhook is automatically created with `wallet.delegation.created` and `wallet.delegation.revoked` events enabled.

### 7. Run the development server

```bash
pnpm dev
```

### 8. Test the webhook flow

1. Use a tool like [ngrok](https://ngrok.com) to expose your local server
2. Configure the webhook URL in Dynamic dashboard: `https://your-url.ngrok.io/api/webhooks/dynamic`
3. Create a delegated wallet in your app
4. Check the console logs to see the decryption and storage in action
5. Test revoking the delegation to see the `wallet.delegation.revoked` event

### 9. Test delegated access methods

Once a wallet is delegated, you can:

1. **Use the UI**: Click the buttons in the delegated access panel to:

   - View stored delegation details
   - Sign a message with your delegated wallet
   - Revoke the delegation

2. **Use the API directly**:

```bash
# Get delegation for an address and chain
curl "http://localhost:3000/api/delegation?address=0x123...&chain=EVM"

# Sign a message with a delegated wallet
curl -X POST http://localhost:3000/api/delegation/sign \
  -H "Content-Type: application/json" \
  -d '{"address": "0x123...", "chain": "EVM", "message": "Hello, World!"}'
```

**Security Note:** In production, these endpoints should be protected with authentication. Consider:

- Dynamic's JWT verification to validate the requesting user
- API keys for server-to-server communication
- Rate limiting to prevent abuse

## How It Works

### Triggering Delegation (Client-Side)

Delegation can be triggered in two ways:

1. **Auto-prompt on sign-in** - Configure in the Dynamic dashboard to prompt users automatically
2. **Programmatically** - Use the `useWalletDelegation` hook:

```typescript
import { useWalletDelegation } from "@dynamic-labs/sdk-react-core";

const { initDelegationProcess } = useWalletDelegation();

// Trigger delegation for the user's wallet
await initDelegationProcess();
```

### Delegation Creation Flow

When a user approves delegation:

1. **User approves** - User sees a prompt and grants delegation permissions
2. **Reshare ceremony** - Dynamic generates new user and server shares
3. **Dynamic encrypts** - Delegation share and per-wallet API key are encrypted with your RSA public key
4. **Webhook sent** - `wallet.delegation.created` event is sent to your endpoint
5. **Signature verified** - Your server verifies the webhook signature using HMAC-SHA256
6. **Shares decrypted** - Your server decrypts the materials using your RSA private key
7. **Shares stored** - Decrypted shares are stored in Redis for delegated operations

**Note:** Each wallet receives its own unique API key, scoped only to that wallet.

### Delegation Revocation Flow

Users can revoke delegation at any time, immediately disabling delegated operations:

1. **User revokes** - Via Dynamic's UI or the `revokeDelegation` hook
2. **Webhook sent** - `wallet.delegation.revoked` event is sent to your endpoint
3. **Signature verified** - Your server verifies the webhook signature
4. **Shares deleted** - Your server removes the delegation from Redis

```typescript
import { useWalletDelegation, ChainEnum } from "@dynamic-labs/sdk-react-core";

const { revokeDelegation } = useWalletDelegation();

await revokeDelegation([
  {
    chainName: ChainEnum.Evm,
    accountAddress: "0x123...",
  },
]);
```

### Encryption Scheme

Dynamic uses **hybrid encryption** for maximum security and performance:

#### Step 1: Encryption (Dynamic's side)

- Generate random AES-256 symmetric key
- Encrypt symmetric key with your RSA public key (RSA-OAEP + SHA-256) → `ek` field
- Encrypt delegation share with symmetric key (AES-256-GCM) → `ct` field
- Include initialization vector (`iv`) and authentication tag (`tag`)

#### Step 2: Decryption (Your side)

```typescript
// 1. Decrypt symmetric key with RSA private key
const symmetricKey = crypto.privateDecrypt(rsaPrivateKey, encryptedKey);

// 2. Decrypt data with symmetric key using AES-GCM
const decrypted = crypto.createDecipheriv("aes-256-gcm", symmetricKey, iv);
```

This approach combines:

- **RSA security** for key exchange
- **AES performance** for data encryption
- **GCM authentication** to prevent tampering

## Project Structure

```text
lib/
├── dynamic/
│   ├── delegation/          # Delegation decryption & storage
│   │   ├── decrypt.ts       # RSA+AES decryption logic
│   │   ├── sign.ts          # Delegated message signing
│   │   ├── storage.ts       # Redis-based storage
│   │   └── types.ts         # TypeScript interfaces
│   ├── webhooks/            # Dynamic webhook handlers
│   │   ├── handlers.ts      # Event handlers (created/revoked)
│   │   ├── schemas.ts       # Zod validation schemas
│   │   └── verify-signature.ts
│   └── index.ts             # Dynamic SDK re-exports
├── redis.ts                 # Redis client (Vercel KV + ioredis)
app/api/
├── webhooks/dynamic/        # Webhook endpoint
│   └── route.ts             # POST handler for Dynamic webhooks
└── delegation/              # Delegation API
    ├── route.ts             # GET handler for retrieving delegations
    └── sign/
        └── route.ts         # POST handler for signing messages
```

## Security Notes

### This is a Demo

**What this demo uses:**

- Environment variables for private key storage
- Redis for storing decrypted delegation shares (unencrypted)
- Basic error handling without comprehensive logging

**Why this works for development:**

- Fast iteration and testing
- Works with serverless (Vercel) via Vercel KV
- Simple local setup with Redis

**Important:** Dynamic recommends re-encrypting delegation shares before storage. This demo stores shares in plain text for simplicity. In production, encrypt shares at rest using your own encryption layer.

### Production Considerations

**For production deployments, you MUST:**

#### 1. Use Cloud Key Management Service (KMS)

**Recommended:** Never expose your private key at all

```typescript
// AWS KMS example
import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";

const kms = new KMSClient({ region: "us-east-1" });
const result = await kms.send(
  new DecryptCommand({
    CiphertextBlob: encryptedData,
    KeyId: "arn:aws:kms:...",
    EncryptionAlgorithm: "RSAES_OAEP_SHA_256",
  })
);
```

**Alternatives:**

- **Google Cloud KMS** - Similar to AWS KMS
- **Azure Key Vault** - Microsoft's managed HSM
- **HashiCorp Vault Transit** - Self-hosted encryption-as-a-service

**Benefits:**

- Private key never leaves the HSM
- Audit logs for all operations
- Automatic key rotation
- FIPS 140-2 compliance

#### 2. Store Private Keys Securely

If you must store private keys (not recommended), use:

- **AWS Secrets Manager** - Managed secrets with automatic rotation
- **HashiCorp Vault** - Self-hosted with extensive audit trails
- **Google Secret Manager** - GCP's secret storage
- **Azure Key Vault Secrets** - For Azure deployments

**Never:**

- ❌ Use environment variables in production
- ❌ Commit keys to version control
- ❌ Store keys in plain text files
- ❌ Share keys across environments

#### 3. Use Encrypted Database Storage

**For delegation shares, use:**

```typescript
// PostgreSQL with encryption at rest
await db.query(
  `
  INSERT INTO delegations (user_id, chain, encrypted_share)
  VALUES ($1, $2, pgp_sym_encrypt($3, $4))
`,
  [userId, chain, share, encryptionKey]
);
```

**Database options:**

- **PostgreSQL** with pgcrypto extension
- **MongoDB** with client-side field encryption
- **DynamoDB** with encryption at rest
- **Cloud SQL** with automatic encryption

**Add these features:**

- Encryption at rest
- Indexes on userId and walletId
- TTL/expiration policies
- Access audit logging
- Rate limiting

#### 4. Serverless Deployment

This demo already supports serverless deployments via Redis:

- **Vercel KV** - Set `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables
- **Upstash Redis** - Set `KV_URL` to your Upstash Redis URL

For alternative storage backends, consider:

- **AWS DynamoDB** - Serverless NoSQL database with encryption at rest
- **PlanetScale** - Serverless MySQL with field-level encryption

#### 5. Best Practices Checklist

- [ ] Use KMS for decryption (or encrypted database for keys)
- [ ] Store shares encrypted at rest
- [ ] Decrypt on-demand, not at storage time
- [ ] Use separate keys for dev/staging/production
- [ ] Implement key rotation schedule
- [ ] Add audit logging for all delegation access
- [ ] Set up alerts for failed decryption attempts
- [ ] Implement rate limiting on webhook endpoints
- [ ] Use secrets manager for all credentials
- [ ] Test disaster recovery procedures

## Resources

- [Delegated Access Overview](https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/delegated-access/overview)
- [Delegated Access Setup](https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/delegated-access/configuration)
- [useWalletDelegation Hook](https://www.dynamic.xyz/docs/react-sdk/hooks/usewalletdelegation)
- [Node SDK Reference](https://www.dynamic.xyz/docs/node-sdk/overview)
- [Webhook Documentation](https://www.dynamic.xyz/docs/developer-dashboard/webhooks)
- [Webhook Signature Validation](https://www.dynamic.xyz/docs/guides/webhooks-signature-validation)
- [AWS KMS Best Practices](https://docs.aws.amazon.com/kms/latest/developerguide/best-practices.html)

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Dynamic SDK** - Wallet delegation and webhooks
- **TypeScript** - Type safety
- **Zod** - Runtime schema validation
- **Redis** - Vercel KV or ioredis for delegation storage
- **Node.js Crypto** - Built-in encryption (RSA-OAEP, AES-GCM)
