import { type NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { getDelegationStatus } from "@/lib/shared/delegation-store";
import { DELEGATION_CHAIN } from "@/lib/shared/constants";

/**
 * Returns delegation status for a wallet address: whether the authorize step has
 * stored credentials (`delegated`) and whether the user has set a spending
 * password (`secured`). On-chain addresses are public, so no auth is required.
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "A valid `address` query param is required" },
      { status: 400 }
    );
  }

  const { exists, secured } = await getDelegationStatus(address, DELEGATION_CHAIN);
  return NextResponse.json({ address, delegated: exists, secured });
}
