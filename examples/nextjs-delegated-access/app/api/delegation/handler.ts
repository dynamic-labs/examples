import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDelegationByAddress } from "@/lib/dynamic/delegation";
import { DelegationQuerySchema } from "./schema";

/**
 * Handler for GET /api/delegation requests
 *
 * Retrieve delegation record for a specific wallet address and chain
 *
 * ⚠️ DEMO ONLY: This endpoint is NOT protected by authentication.
 *
 * In production, you MUST:
 * - Add authentication (verify Dynamic JWT tokens)
 * - Ensure users can only access their own delegations
 * - Add rate limiting
 * - Log access for audit trails
 *
 * Query params (both required):
 * - address: Wallet address to fetch delegation for
 * - chain: Chain identifier (e.g., "EVM")
 *
 * Example:
 * - GET /api/delegation?address=0x123...&chain=EVM - Get delegation for address on chain
 */
export async function handleGetDelegationRequest(
  request: NextRequest
): Promise<NextResponse> {
  const { searchParams } = request.url
    ? new URL(request.url)
    : { searchParams: new URLSearchParams() };

  // Convert searchParams to object for Zod validation
  const queryParams = {
    address: searchParams.get("address"),
    chain: searchParams.get("chain"),
  };

  // Validate query parameters with Zod
  const validationResult = DelegationQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid query parameters",
        details: validationResult.error.issues,
      },
      { status: 400 }
    );
  }

  const { address, chain } = validationResult.data;

  // Get delegation by address and chain
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

  // Return only the requested fields
  return NextResponse.json(
    {
      success: true,
      data: {
        address: delegation.address,
        walletId: delegation.walletId,
        walletApiKey: delegation.walletApiKey,
        delegatedShare: delegation.delegatedShare,
      },
    },
    { status: 200 }
  );
}
