import { type NextRequest, NextResponse } from "next/server";
import { getPendingByUserCode } from "@/lib/shared/agent-grants";

/**
 * Public, read-only info about a pending grant — lets the /authorize page show
 * the user which wallet an agent is requesting before they approve. Returns the
 * (non-secret) wallet address, or 404 if the code is unknown/expired/resolved.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "A `code` query param is required" }, { status: 400 });
  }
  const pending = await getPendingByUserCode(code);
  if (!pending) {
    return NextResponse.json({ error: "Unknown or expired code" }, { status: 404 });
  }
  return NextResponse.json({ address: pending.address });
}
