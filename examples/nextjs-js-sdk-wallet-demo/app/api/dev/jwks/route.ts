/**
 * [Dev Utility] JWKS Endpoint
 *
 * Serves the public key used to verify JWTs signed by this demo's
 * JWT provider. Dynamic fetches this endpoint to validate external JWTs.
 *
 * This is a dev-only utility — not part of the Dynamic SDK integration.
 * Must be publicly accessible (use ngrok for local development).
 *
 * GET /api/dev/jwks
 *
 * @see https://www.dynamic.xyz/docs/javascript/external-auth/third-party-auth-setup
 * @see https://datatracker.ietf.org/doc/html/rfc7517
 */

import { NextResponse } from "next/server";

export async function GET() {
  const publicKeyJson = process.env.JWT_PROVIDER_PUBLIC_KEY;

  if (!publicKeyJson) {
    return NextResponse.json(
      {
        error:
          "JWT_PROVIDER_PUBLIC_KEY not configured. Run: npx tsx scripts/generate-keypair.ts",
      },
      { status: 500 },
    );
  }

  try {
    const publicKey = JSON.parse(publicKeyJson);

    return NextResponse.json(
      { keys: [publicKey] },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid JWT_PROVIDER_PUBLIC_KEY format" },
      { status: 500 },
    );
  }
}
