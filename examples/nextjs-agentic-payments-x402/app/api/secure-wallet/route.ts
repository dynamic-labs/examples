import { type NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";
import { DELEGATION_CHAIN } from "@/lib/shared/constants";
import { secureDelegation } from "@/lib/shared/delegation-store";

/**
 * Secures a delegated wallet with a password.
 *
 * Re-encrypts the stored key share under a key derived from the server master
 * key + the user's password (see lib/shared/delegation-store.ts). After this,
 * the agent can only spend from the wallet if it's given the same password.
 *
 * NOTE (demo scope): this endpoint isn't identity-gated, so it can only ever
 * *set* a password on an as-yet-unsecured wallet (securing an already-secured
 * one is rejected). That can't expose funds — decryption still requires the
 * server master key — but in production you'd gate this with the owner's
 * Dynamic JWT (verify the session token, confirm it owns the address).
 */
const BodySchema = z.object({
  address: z.string().refine(isAddress, "Invalid wallet address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    await secureDelegation(parsed.data.address, DELEGATION_CHAIN, parsed.data.password);
    return NextResponse.json({ secured: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to secure wallet";
    // "already password-protected" / "no delegation" are client-correctable → 409/404-ish.
    const status = /already|no delegation/i.test(message) ? 409 : 500;
    if (status === 500) console.error("secure-wallet failed:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
