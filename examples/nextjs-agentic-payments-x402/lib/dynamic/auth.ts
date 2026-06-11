/**
 * Server-side verification of Dynamic session JWTs.
 *
 * The /authorize page sends the signed-in user's Dynamic JWT (cookie or Bearer)
 * to the grant-approval endpoint. We verify it against Dynamic's JWKS and read
 * the user's verified credentials so we can confirm they actually own the wallet
 * an agent is asking to act on.
 *
 * @see https://docs.dynamic.xyz/authentication-methods/how-to-validate-users-on-the-backend
 */
import "server-only";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";

/** A verified credential (wallet/email) from a Dynamic JWT. */
export interface JwtVerifiedCredential {
  address?: string;
  chain?: string;
  format?: string;
  wallet_name?: string;
  wallet_provider?: string;
}

export interface DynamicJwtPayload extends JwtPayload {
  sub: string;
  /** Space-separated OAuth scopes; must include `user:basic` when auth is complete. */
  scope?: string;
  environment_id?: string;
  verified_credentials: JwtVerifiedCredential[];
  email?: string;
}

const DYNAMIC_ENV_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID;
const JWKS_URL = `https://app.dynamic.xyz/api/v0/sdk/${DYNAMIC_ENV_ID}/.well-known/jwks`;

const client = new JwksClient({
  jwksUri: JWKS_URL,
  rateLimit: true,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600_000, // 10 minutes
});

/** Verify a Dynamic JWT; returns the decoded payload, or null if invalid. */
export async function verifyDynamicJWT(
  token: string
): Promise<DynamicJwtPayload | null> {
  try {
    const signingKey = await client.getSigningKey();
    const publicKey = signingKey.getPublicKey();
    const payload = jwt.verify(token, publicKey, {
      ignoreExpiration: false,
    }) as DynamicJwtPayload;

    // The user must have fully completed authentication — Dynamic signals this
    // with the `user:basic` scope. Intermediate scopes (e.g. requiresAdditionalAuth
    // for pending MFA) must not be trusted for a sensitive approval.
    const scopes = (payload.scope ?? "").split(/\s+/).filter(Boolean);
    if (!scopes.includes("user:basic")) {
      console.error("JWT missing user:basic scope — auth not complete");
      return null;
    }
    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/** True if the authenticated user owns `address` (case-insensitive). */
export function userOwnsAddress(
  user: DynamicJwtPayload,
  address: string
): boolean {
  return (user.verified_credentials ?? []).some(
    (c) => c.address?.toLowerCase() === address.toLowerCase()
  );
}

/** Pull the Dynamic JWT from an Authorization: Bearer header or the session cookie. */
export function extractDynamicJwt(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }
  // Cookie-based sessions: the SDK stores the JWT in DYNAMIC_JWT_TOKEN.
  const cookie = request.headers.get("cookie") ?? "";
  const match = /(?:^|;\s*)DYNAMIC_JWT_TOKEN=([^;]+)/.exec(cookie);
  return match ? decodeURIComponent(match[1]) : null;
}
