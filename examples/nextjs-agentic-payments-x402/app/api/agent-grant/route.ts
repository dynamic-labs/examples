import { type NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";
import { DELEGATION_CHAIN } from "@/lib/shared/constants";
import { createGrant, pollGrant } from "@/lib/shared/agent-grants";

/**
 * Device-authorization grant endpoints (self-hosted).
 *
 * POST  /api/agent-grant            → start a grant for a wallet; returns a
 *                                      user_code + grant_code (poll secret) +
 *                                      the /authorize URL to show the user.
 * GET   /api/agent-grant?grant_code= → the agent polls this until the wallet
 *                                      owner approves/denies at /authorize.
 *
 * Approval (which requires the owner's verified Dynamic JWT) lives in
 * /api/agent-grant/approve.
 */
const StartSchema = z.object({
  address: z.string().refine(isAddress, "Invalid wallet address"),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = StartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const grant = await createGrant(parsed.data.address, DELEGATION_CHAIN);
    const verificationUri = new URL(
      `/authorize?code=${grant.userCode}`,
      request.nextUrl.origin
    ).toString();
    return NextResponse.json({
      userCode: grant.userCode,
      grantCode: grant.grantCode,
      verificationUri,
      expiresInSeconds: grant.expiresInSeconds,
      pollIntervalSeconds: grant.pollIntervalSeconds,
    });
  } catch (err) {
    console.error("Failed to start grant:", err);
    return NextResponse.json({ error: "Failed to start grant" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const grantCode = request.nextUrl.searchParams.get("grant_code");
  if (!grantCode) {
    return NextResponse.json(
      { error: "A `grant_code` query param is required" },
      { status: 400 }
    );
  }

  try {
    const grant = await pollGrant(grantCode);
    if (!grant) {
      // Unknown or expired grant.
      return NextResponse.json({ status: "expired" }, { status: 404 });
    }
    return NextResponse.json({ status: grant.status });
  } catch (err) {
    console.error("Failed to poll grant:", err);
    return NextResponse.json({ error: "Failed to poll grant" }, { status: 500 });
  }
}
