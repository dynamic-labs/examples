import { type NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { getDelegationByAddress } from "@/lib/shared/delegation-store";
import { DELEGATION_CHAIN } from "@/lib/shared/constants";

/**
 * Returns whether a given wallet address has an active delegation on this server.
 *
 * Used by the UI to skip the "Authorize your agent" step when the user has
 * already delegated (even if their localStorage was cleared or they switched
 * browsers). Wallet addresses are public, so no auth is required.
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "A valid `address` query param is required" },
      { status: 400 }
    );
  }

  try {
    const delegation = await getDelegationByAddress(address, DELEGATION_CHAIN);
    return NextResponse.json({ delegated: delegation != null });
  } catch (err) {
    console.error("Delegation status check failed:", err);
    return NextResponse.json({ error: "Failed to check delegation status" }, { status: 502 });
  }
}
