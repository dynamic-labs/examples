import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getDelegationByAddress, signMessage } from "@/lib/dynamic/delegation";
import { SignMessageRequestSchema } from "./schema";

/**
 * Handler for signing messages with delegated wallets
 *
 * This handler:
 * 1. Validates the request body using Zod schema
 * 2. Retrieves the delegated share by address and chain
 * 3. Signs the message using the delegated share
 *
 * ⚠️ DEMO ONLY: This endpoint is NOT protected by authentication.
 *
 * In production, you MUST:
 * - Add authentication (verify Dynamic JWT tokens)
 * - Ensure users can only sign messages for their own delegations
 * - Add rate limiting
 * - Log access for audit trails
 */
export async function handleSignMessageRequest(
  request: NextRequest
): Promise<NextResponse> {
  const body = await request.json();

  // Validate request body with Zod
  const validationResult = SignMessageRequestSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request body",
        details: validationResult.error.issues,
      },
      { status: 400 }
    );
  }

  const { address, chain, message } = validationResult.data;

  // Get the delegated share by address and chain
  const delegation = await getDelegationByAddress(address, chain);
  if (!delegation) {
    return NextResponse.json(
      {
        success: false,
        error: `No delegation found for address ${address} on chain ${chain}`,
      },
      { status: 404 }
    );
  }

  const signature = await signMessage(message, delegation);

  return NextResponse.json(
    { success: true, signature, message },
    { status: 200 }
  );
}
