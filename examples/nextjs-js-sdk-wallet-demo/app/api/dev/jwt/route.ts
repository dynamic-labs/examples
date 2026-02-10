/**
 * [Dev Utility] JWT Generation Endpoint
 *
 * Signs a JWT with the demo's private key. The resulting token can be
 * used with Dynamic's `signInWithExternalJwt` to test external auth.
 *
 * This is a dev-only utility — not part of the Dynamic SDK integration.
 *
 * POST /api/dev/jwt
 * Body: { sub?: string, email?: string }
 *
 * @see https://www.dynamic.xyz/docs/javascript/external-auth/third-party-auth-usage
 */

import { importJWK, SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const privateKeyJson = process.env.JWT_PROVIDER_PRIVATE_KEY;
  const issuer = process.env.JWT_PROVIDER_ISSUER;
  const kid = process.env.JWT_PROVIDER_KID;

  if (!privateKeyJson || !issuer || !kid) {
    return NextResponse.json(
      {
        error:
          "JWT provider not configured. Run: npx tsx scripts/generate-keypair.ts",
        missing: {
          JWT_PROVIDER_PRIVATE_KEY: !privateKeyJson,
          JWT_PROVIDER_ISSUER: !issuer,
          JWT_PROVIDER_KID: !kid,
        },
      },
      { status: 500 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const sub = body.sub || crypto.randomUUID();
    const email = body.email || undefined;

    // Import the private key
    const privateJwk = JSON.parse(privateKeyJson);
    const privateKey = await importJWK(privateJwk, "RS256");

    // Build JWT claims
    const jwt = new SignJWT({
      ...(email ? { email, emailVerified: true } : {}),
    })
      .setProtectedHeader({ alg: "RS256", kid })
      .setIssuer(issuer)
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime("1h");

    const token = await jwt.sign(privateKey);

    return NextResponse.json({ token, sub, email: email || null });
  } catch (error) {
    console.error("JWT generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate JWT", details: String(error) },
      { status: 500 },
    );
  }
}
