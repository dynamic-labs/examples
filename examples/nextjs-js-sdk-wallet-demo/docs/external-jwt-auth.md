# External JWT Authentication

Sign in to Dynamic using a JWT from your own authentication system. This guide walks through setting up the demo's built-in JWT provider for testing.

## Overview

Dynamic's external auth feature lets you exchange a JWT from any issuer for a Dynamic session. Dynamic verifies the JWT by:

1. Fetching your public key from a **JWKS endpoint** you provide
2. Validating the `iss`, `sub`, and `exp` claims
3. Creating a Dynamic user linked to your external user ID

## Dynamic Docs

- [Overview — Using your own authentication provider](https://www.dynamic.xyz/docs/javascript/external-auth/third-party-auth-overview)
- [Dashboard Setup — Configuring your authentication provider](https://www.dynamic.xyz/docs/javascript/external-auth/third-party-auth-setup)
- [Usage — Integrating your authentication provider with Dynamic](https://www.dynamic.xyz/docs/javascript/external-auth/third-party-auth-usage)

## Setup

### 1. Generate a key pair

Run the key generation script to create an RSA-256 key pair:

```bash
npx tsx scripts/generate-keypair.ts
```

This outputs environment variables. Copy and paste them into `.env.local`:

```env
JWT_PROVIDER_KID=demo-key-1234567890
JWT_PROVIDER_ISSUER=https://demo-jwt-provider.example.com
JWT_PROVIDER_PUBLIC_KEY='{"kty":"RSA","n":"...","e":"...","kid":"...","use":"sig","alg":"RS256"}'
JWT_PROVIDER_PRIVATE_KEY='{"kty":"RSA","n":"...","e":"...","d":"...","kid":"...","use":"sig","alg":"RS256"}'
```

### 2. Start ngrok

Dynamic's servers need to reach your JWKS endpoint to verify JWT signatures. Since `localhost` is not publicly accessible, you need a tunnel:

```bash
ngrok http <port>  # e.g. ngrok http 3001 — match your dev server port
```

Copy the forwarding URL (e.g., `https://a1b2c3d4.ngrok-free.app`).

### 3. Configure the Dynamic dashboard

Go to the [External Authentication](https://app.dynamic.xyz/dashboard/developer/third-party-auth) page in your Dynamic dashboard and enter:

| Field       | Value                                                 |
| ----------- | ----------------------------------------------------- |
| **iss**     | `https://demo-jwt-provider.example.com`               |
| **jwksUrl** | `https://<your-ngrok-id>.ngrok-free.app/api/dev/jwks` |
| **aud**     | _(leave empty)_                                       |

Replace `<your-ngrok-id>` with your actual ngrok subdomain.

### 4. Enable the feature

Toggle **External Authentication** to enabled in the dashboard.

### 5. Restart the dev server

```bash
pnpm dev
```

The JWT auth section should now appear on the sign-in page (if `isExternalAuthEnabled()` returns `true` from `projectSettings`).

## Usage

### Generator page

Visit `/jwt` in your browser to generate test tokens.

The page provides two actions:

1. **Generate** — creates a signed JWT for inspection and manual use
2. **Generate & Sign In** — creates a JWT and immediately authenticates, redirecting to the dashboard

### API routes

You can also use the API routes directly:

**Generate a JWT:**

```bash
curl -X POST http://localhost:<port>/api/dev/jwt \
  -H "Content-Type: application/json" \
  -d '{"sub": "user-123", "email": "test@example.com"}'
```

Response:

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sub": "user-123",
  "email": "test@example.com"
}
```

**Verify the JWKS endpoint:**

```bash
curl http://localhost:<port>/api/dev/jwks
```

Response:

```json
{
  "keys": [
    {
      "kty": "RSA",
      "n": "...",
      "e": "AQAB",
      "kid": "demo-key-1234567890",
      "use": "sig",
      "alg": "RS256"
    }
  ]
}
```

## JWT Claims Reference

| Claim           | Required | Description                                               |
| --------------- | -------- | --------------------------------------------------------- |
| `iss`           | Yes      | Issuer — must match the value configured in the dashboard |
| `sub`           | Yes      | Subject — your user ID, mapped to Dynamic's user model    |
| `exp`           | Yes      | Expiration — Unix timestamp, Dynamic enforces this        |
| `iat`           | No       | Issued at — set automatically                             |
| `email`         | No       | User's email address                                      |
| `emailVerified` | No       | Set to `true` if the email has been previously verified   |

## Files

| File                                   | Purpose                                      |
| -------------------------------------- | -------------------------------------------- |
| `scripts/generate-keypair.ts`          | One-time RSA key pair generation             |
| `app/api/dev/jwks/route.ts`            | JWKS public key endpoint (dev utility)       |
| `app/api/dev/jwt/route.ts`             | JWT signing endpoint (dev utility)           |
| `app/api/dev/ngrok/route.ts`           | Ngrok tunnel detection (dev utility)         |
| `app/jwt/page.tsx`                     | JWT generator UI page                        |
| `lib/dynamic/auth-jwt.ts`              | SDK wrapper for `signInWithExternalJwt`      |
| `components/auth/jwt-auth-section.tsx` | Collapsible JWT login section in auth screen |

## Troubleshooting

- **JWT section not visible on sign-in page:** Check that External Authentication is enabled in the dashboard and that `iss` and `jwksUrl` are configured. Note: `projectSettings.security.externalAuth.enabled` is inverted in the current API — the code checks for config presence instead.
- **"JWT_PROVIDER_PUBLIC_KEY not configured":** Run `npx tsx scripts/generate-keypair.ts` and add the output to `.env.local`, then restart the dev server.
- **Dynamic can't verify the JWT:** Make sure ngrok is running and the `jwksUrl` in the dashboard points to your ngrok URL (not `localhost`).
- **"invalid_external_auth" error:** The `iss` claim in the JWT doesn't match what's configured in the dashboard. They must be identical.
