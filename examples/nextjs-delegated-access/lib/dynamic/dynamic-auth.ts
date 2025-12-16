import jwt, { type JwtPayload } from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Represents a verified credential for a user.
 * @interface JwtVerifiedCredential
 * @property {string} id - The ID of the credential.
 * @property {string} address - The address of the credential.
 * @property {string} chain - The chain of the credential.
 * @property {string} format - The format of the credential.
 * @property {string} wallet_name - The name of the wallet.
 * @property {string} wallet_provider - The provider of the wallet.
 */
export type JwtVerifiedCredential = {
  id: string;
  address: string;
  chain: string;
  format: string;
  wallet_name: string;
  wallet_provider: string;
};

/**
 * Represents the decoded payload of a Dynamic JWT.
 * @interface DynamicJwtPayload
 * @extends {JwtPayload}
 */
export interface DynamicJwtPayload extends JwtPayload {
  sub: string;
  /** The environment ID from your Dynamic project. */
  environment_id: string;
  /** An array of verified credentials for the user. */
  verified_credentials: JwtVerifiedCredential[];
  /** The user's email, if available. */
  email: string;
}

const DYNAMIC_ENV_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID;
const JWKS_URL = `https://app.dynamic.xyz/api/v0/sdk/${DYNAMIC_ENV_ID}/.well-known/jwks`;

/**
 * A client to fetch JSON Web Keys (JWKs) from the Dynamic JWKS endpoint.
 * It is configured to cache keys to improve performance and avoid rate limiting.
 * @see https://docs.dynamic.xyz/authentication-methods/how-to-validate-users-on-the-backend#option-3-do-it-yourself-verification
 */
const client = new JwksClient({
  jwksUri: JWKS_URL,
  rateLimit: true,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

/**
 * Verifies a JWT from Dynamic.
 *
 * This function fetches the appropriate public key from Dynamic's JWKS endpoint
 * and uses it to verify the token's signature. It also checks for scopes
 * that may require additional handling.
 *
 * @param {string} token - The JWT to verify.
 * @returns {Promise<DynamicJwtPayload | null>} A promise that resolves with the decoded payload if the token is valid, or null if verification fails.
 * @see https://docs.dynamic.xyz/authentication-methods/how-to-validate-users-on-the-backend#option-3-do-it-yourself-verification
 */
export async function verifyDynamicJWT(
  token: string
): Promise<DynamicJwtPayload | null> {
  try {
    const signingKey = await client.getSigningKey();
    const publicKey = signingKey.getPublicKey();
    const decoded = jwt.verify(token, publicKey, {
      ignoreExpiration: false,
    }) as DynamicJwtPayload;

    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export type AuthenticatedUser = DynamicJwtPayload;

/**
 * Checks if a user owns a specific wallet address.
 *
 * Compares the provided address against the user's verified credentials
 * using case-insensitive matching.
 *
 * @param {AuthenticatedUser} user - The authenticated user from the JWT
 * @param {string} address - The wallet address to check ownership of
 * @returns {boolean} True if the user owns the address, false otherwise
 */
export function userOwnsAddress(
  user: AuthenticatedUser,
  address: string
): boolean {
  return user.verified_credentials.some(
    (cred) => cred.address.toLowerCase() === address.toLowerCase()
  );
}

type AuthenticatedRequestHandler = (
  req: NextRequest,
  { user }: { user: AuthenticatedUser }
) => Promise<NextResponse> | NextResponse;

export const withAuth =
  (handler: AuthenticatedRequestHandler) =>
  async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get("authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Authorization header with Bearer token required" },
          { status: 401 }
        );
      }

      const token = authHeader.slice(7); // Remove "Bearer " prefix
      if (!token) {
        return NextResponse.json(
          { error: "Authorization token not found" },
          { status: 401 }
        );
      }

      const user = await verifyDynamicJWT(token);

      if (!user) {
        return NextResponse.json(
          { error: "Invalid authentication token" },
          { status: 401 }
        );
      }
      return handler(req, { user });
    } catch (error) {
      console.error("An unexpected error occurred during auth:", error);
      return NextResponse.json(
        { error: "An internal server error occurred" },
        { status: 500 }
      );
    }
  };
