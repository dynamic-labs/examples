import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  extractDynamicJwt,
  userOwnsAddress,
  verifyDynamicJWT,
} from "@/lib/dynamic/auth";
import { getPendingByUserCode, resolveGrant } from "@/lib/shared/agent-grants";

/**
 * Approve or deny a pending agent grant — the owner-authorization step.
 *
 * Called by the /authorize page on behalf of the signed-in user. We verify the
 * user's Dynamic session JWT and confirm it owns the wallet the grant is for,
 * so only the wallet's actual owner can authorize an agent to act on it.
 */
const ApproveSchema = z.object({
  userCode: z.string().min(1),
  action: z.enum(["approve", "deny"]),
});

export async function POST(request: NextRequest) {
  // 1. Authenticate the user via their Dynamic JWT (cookie or Bearer).
  const token = extractDynamicJwt(request);
  if (!token) {
    return NextResponse.json(
      { error: "Sign in to approve this request" },
      { status: 401 }
    );
  }
  const user = await verifyDynamicJWT(token);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }

  // 2. Validate the body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
  const { userCode, action } = parsed.data;

  // 3. Resolve the pending grant → which wallet is being authorized.
  const pending = await getPendingByUserCode(userCode);
  if (!pending) {
    return NextResponse.json(
      { error: "This code is invalid or has expired" },
      { status: 404 }
    );
  }

  // 4. Ownership check: the signed-in user must own that wallet.
  if (!userOwnsAddress(user, pending.address)) {
    return NextResponse.json(
      { error: "You don't own the wallet this agent is requesting" },
      { status: 403 }
    );
  }

  // 5. Approve/deny.
  const resolved = await resolveGrant(userCode, action, user.sub);
  if (!resolved) {
    return NextResponse.json(
      { error: "This request is no longer pending" },
      { status: 409 }
    );
  }

  return NextResponse.json({ status: action === "approve" ? "approved" : "denied" });
}
