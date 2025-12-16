import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  type AuthenticatedUser,
  userOwnsAddress,
} from "@/lib/dynamic/dynamic-auth";
import { getDelegationByAddress, signMessage } from "@/lib/dynamic/delegation";
import { SignMessageRequestSchema } from "./schema";

/**
 * Handler for signing messages with delegated wallets
 *
 * This handler:
 * 1. Validates the request body using Zod schema
 * 2. Verifies the user owns the requested wallet address
 * 3. Retrieves the delegated share by address and chain
 * 4. Signs the message using the delegated share
 *
 * Protected by Dynamic JWT authentication - users can only
 * sign messages for their own verified wallet addresses.
 */
export async function handleSignMessageRequest(
  request: NextRequest,
  user: AuthenticatedUser
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

  // Authorization: Ensure the user owns the requested address
  if (!userOwnsAddress(user, address)) {
    return NextResponse.json(
      {
        success: false,
        error: "You are not authorized to sign for this address",
      },
      { status: 403 }
    );
  }

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
