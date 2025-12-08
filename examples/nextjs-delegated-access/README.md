# Dynamic Delegated Access Example

A Next.js demo showcasing how to build delegated wallet access with Dynamic's webhook system, including secure encryption/decryption of delegation shares.

## What This Demo Does

This application demonstrates:

- **Webhook integration** - Receive and process Dynamic delegation webhooks
- **Secure decryption** - Decrypt delegation shares using RSA-OAEP + AES-GCM hybrid encryption
- **Share storage** - Store decrypted shares for delegated operations (demo: in-memory)
- **Production guidance** - Learn best practices for production deployments with KMS and encrypted storage

## Key Features

- 🔐 **Webhook handling** - Process delegation created/updated events from Dynamic
- 🔓 **Hybrid decryption** - RSA-OAEP for key exchange, AES-256-GCM for data encryption
- 💾 **Flexible storage** - In-memory demo with clear production migration path
- 📚 **Educational** - Comprehensive documentation on security best practices

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Generate RSA keypair

```bash
# Generate private key (3072-bit RSA)
openssl genrsa -out private-key.pem 3072

# Extract public key
openssl rsa -in private-key.pem -pubout -out public-key.pem
```

### 3. Configure environment variables

```bash
# Copy the example file
cp .env.example .env.local

# Add your Dynamic Environment ID
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_env_id_here

# Add your webhook secret from Dynamic dashboard
DYNAMIC_WEBHOOK_SECRET=your_webhook_secret_here

# Add your Dynamic API token (for server-side operations)
DYNAMIC_API_TOKEN=your_api_token_here

# Add your private key (copy contents of private-key.pem)
DYNAMIC_DELEGATION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"
```

### 4. Upload public key to Dynamic

1. Go to your [Dynamic dashboard](https://app.dynamic.xyz)
2. Navigate to Webhooks → Delegation settings
3. Upload the `public-key.pem` file

### 5. Run the development server

```bash
pnpm dev
```

### 6. Test the webhook flow

1. Use a tool like [ngrok](https://ngrok.com) to expose your local server
2. Configure the webhook URL in Dynamic dashboard: `https://your-url.ngrok.io/api/webhooks/dynamic`
3. Create a delegated wallet in your app
4. Check the console logs to see the decryption and storage in action

### 7. Test delegated access methods

Once a wallet is delegated, you can:

1. **Use the UI**: Click the buttons in the delegated access panel to:

   - Fetch all delegations for your user
   - Sign a message with your delegated wallet

2. **Use the API directly**:

```bash
# Get all delegations for a user
curl http://localhost:3000/api/delegation?userId=USER_ID

# Sign a message with a delegated wallet (chain is required)
curl -X POST http://localhost:3000/api/delegation/sign \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "chain": "EVM", "message": "Hello, World!"}'
```

**⚠️ Security Note:** In production, this endpoint should be protected with authentication to ensure users can only access their own delegations. Consider using:

- Dynamic's JWT verification to validate the requesting user
- API keys for server-to-server communication
- Rate limiting to prevent abuse

## How It Works

### Delegation Flow

When a user delegates wallet access:

1. **User delegates** → Through Dynamic's UI, user grants delegation permissions
2. **Dynamic encrypts** → Delegation share and API key are encrypted with your public RSA key
3. **Webhook sent** → `wallet.delegation.created` event is sent to your endpoint
4. **Signature verified** → Your server verifies the webhook signature using HMAC-SHA256
5. **Shares decrypted** → Your server decrypts the shares using your RSA private key
6. **Shares stored** → Decrypted shares are stored for later use in delegated operations

### Encryption Scheme

Dynamic uses **hybrid encryption** for maximum security and performance:

**Step 1: Encryption (Dynamic's side)**

- Generate random AES-256 symmetric key
- Encrypt symmetric key with your RSA public key (RSA-OAEP + SHA-256) → `ek` field
- Encrypt delegation share with symmetric key (AES-256-GCM) → `ct` field
- Include initialization vector (`iv`) and authentication tag (`tag`)

**Step 2: Decryption (Your side)**

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

```
lib/
├── dynamic/
│   ├── delegation/          # Delegation decryption & storage
│   │   ├── decrypt.ts       # RSA+AES decryption logic
│   │   ├── storage.ts       # In-memory demo storage
│   │   └── types.ts         # TypeScript interfaces
│   ├── webhooks/            # Dynamic webhook handlers
│   │   ├── handlers.ts      # Event handlers
│   │   ├── schemas.ts       # Zod validation schemas
│   │   └── verify-signature.ts
│   └── index.ts             # Dynamic SDK re-exports
app/api/
├── webhooks/dynamic/        # Webhook endpoint
│   └── route.ts             # POST handler for Dynamic webhooks
└── delegations/             # Delegation data API
    └── route.ts             # GET handler for retrieving delegations
```

## Security Notes

### ⚠️ This is a Demo

**What this demo uses:**

- Environment variables for private key storage
- In-memory storage for decrypted shares
- Simple error handling

**Why this works for local development:**

- ✅ Single process = memory persists across requests
- ✅ Fast iteration and testing
- ✅ No infrastructure setup required

### ⚠️ Do NOT Use in Production

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

#### 4. Serverless Deployment Considerations

**Problem:** In-memory storage doesn't work on serverless (different lambda instances)

**Solutions:**

- **Vercel KV** (Redis) - Built-in for Vercel deployments
- **Upstash Redis** - Global serverless Redis
- **AWS DynamoDB** - Serverless NoSQL database
- **PlanetScale** - Serverless MySQL

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

- [Dynamic Documentation](https://docs.dynamic.xyz)
- [Dynamic Delegation Guide](https://docs.dynamic.xyz/delegation)
- [Webhook Signature Verification](https://docs.dynamic.xyz/webhooks/signature-validation)
- [AWS KMS Best Practices](https://docs.aws.amazon.com/kms/latest/developerguide/best-practices.html)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Dynamic SDK** - Wallet delegation and webhooks
- **TypeScript** - Type safety
- **Zod** - Runtime schema validation
- **Node.js Crypto** - Built-in encryption (RSA-OAEP, AES-GCM)
