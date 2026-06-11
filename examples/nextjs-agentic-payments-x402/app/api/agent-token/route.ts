import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  pollGrant,
  issueAgentToken,
  verifyAgentToken,
} from "@/lib/shared/agent-grants";
import { getDelegationByAddress } from "@/lib/shared/delegation-store";
import { DELEGATION_CHAIN } from "@/lib/shared/constants";

/**
 * Persistent agent session token endpoints.
 *
 * POST /api/agent-token  { grantCode }
 *   Called by the agent immediately after its first approval. Verifies the
 *   grant is approved, then issues a long-lived token the agent can reuse.
 *
 * GET  /api/agent-token?token=…
 *   Verifies a saved token and confirms the delegation is still active. The
 *   agent calls this on startup; if it returns { valid: true } the approval
 *   flow is skipped entirely. Revoking delegation automatically invalidates
 *   all tokens for that address, forcing re-approval on the next run.
 */

const IssueSchema = z.object({
  grantCode: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = IssueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const grant = await pollGrant(parsed.data.grantCode);
  if (!grant || grant.status !== "approved") {
    return NextResponse.json({ error: "Grant not approved" }, { status: 403 });
  }

  try {
    const token = await issueAgentToken(grant.address, DELEGATION_CHAIN);
    return NextResponse.json({ token });
  } catch (err) {
    console.error("Failed to issue agent token:", err);
    return NextResponse.json({ error: "Failed to issue token" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json(
      { error: "Authorization: Bearer <token> header required" },
      { status: 401 }
    );
  }

  try {
    const record = await verifyAgentToken(token);
    if (!record) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    // Confirm the delegation is still active — revocation should immediately
    // invalidate the token even before the next token table cleanup runs.
    const delegation = await getDelegationByAddress(record.address, record.chain);
    if (!delegation) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true, address: record.address });
  } catch (err) {
    console.error("Failed to verify agent token:", err);
    return NextResponse.json({ error: "Failed to verify token" }, { status: 500 });
  }
}
