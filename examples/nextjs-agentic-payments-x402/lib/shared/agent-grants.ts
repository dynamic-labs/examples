/**
 * Store for self-hosted device-authorization grants (see migration 0005).
 *
 * Flow:
 *  - createGrant(address): mint a user_code (shown to the user) + grant_code
 *    (the agent's poll secret; stored only as a SHA-256 hash). status='pending'.
 *  - getPendingByUserCode(userCode): the /authorize page reads this to show the
 *    user which wallet/agent they're approving.
 *  - resolveGrant(userCode, action, userId): the approval endpoint sets the grant
 *    'approved' (or 'denied') after verifying the user's Dynamic JWT owns the wallet.
 *  - pollGrant(grantCode): the agent polls this with its secret until resolved.
 *
 * Server-only (Supabase service-role key). Grants expire after GRANT_TTL_SECONDS.
 */
import "server-only";
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DELEGATION_CHAIN } from "./constants";

export const GRANT_TTL_SECONDS = 900; // 15 minutes
export const POLL_INTERVAL_SECONDS = 3;

const TABLE = "agent_grants";

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use the grant store"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

const hashGrantCode = (grantCode: string) =>
  crypto.createHash("sha256").update(grantCode).digest("hex");

/** Short, human-readable code with no ambiguous characters (e.g. ABCD-EFGH). */
function generateUserCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  const pick = () =>
    Array.from(crypto.randomBytes(4))
      .map((b) => alphabet[b % alphabet.length])
      .join("");
  return `${pick()}-${pick()}`;
}

export type GrantStatus = "pending" | "approved" | "denied";

export interface CreatedGrant {
  userCode: string;
  grantCode: string;
  expiresInSeconds: number;
  pollIntervalSeconds: number;
}

/** Start a grant for the given wallet address. */
export async function createGrant(
  address: string,
  chain: string = DELEGATION_CHAIN
): Promise<CreatedGrant> {
  const supabase = getSupabase();
  const userCode = generateUserCode();
  const grantCode = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + GRANT_TTL_SECONDS * 1000).toISOString();

  const { error } = await supabase.from(TABLE).insert({
    user_code: userCode,
    grant_code_hash: hashGrantCode(grantCode),
    address: address.toLowerCase(),
    chain,
    status: "pending",
    expires_at: expiresAt,
  });
  if (error) throw new Error(`Failed to create grant: ${error.message}`);

  return {
    userCode,
    grantCode,
    expiresInSeconds: GRANT_TTL_SECONDS,
    pollIntervalSeconds: POLL_INTERVAL_SECONDS,
  };
}

const isExpired = (row: { expires_at: string }) =>
  new Date(row.expires_at).getTime() < Date.now();

/** Look up a still-pending grant by its user_code (for the approval UI). */
export async function getPendingByUserCode(
  userCode: string
): Promise<{ address: string; chain: string } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("address, chain, status, expires_at")
    .eq("user_code", userCode.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(`Failed to read grant: ${error.message}`);
  if (!data || data.status !== "pending" || isExpired(data)) return null;
  return { address: data.address, chain: data.chain };
}

/**
 * Approve or deny a pending grant. Returns the wallet address on success, or
 * null if the grant is unknown/expired/already-resolved. The caller MUST have
 * already verified the approving user's JWT + wallet ownership.
 */
export async function resolveGrant(
  userCode: string,
  action: "approve" | "deny",
  approvedUserId: string
): Promise<{ address: string } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: action === "approve" ? "approved" : "denied",
      approved_user_id: approvedUserId,
    })
    .eq("user_code", userCode.toUpperCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .select("address")
    .maybeSingle();
  if (error) throw new Error(`Failed to resolve grant: ${error.message}`);
  return data ? { address: data.address } : null;
}

/** Poll a grant by its secret grant_code (the agent's call). */
export async function pollGrant(
  grantCode: string
): Promise<{ status: GrantStatus; address: string } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("status, address, expires_at")
    .eq("grant_code_hash", hashGrantCode(grantCode))
    .maybeSingle();
  if (error) throw new Error(`Failed to read grant: ${error.message}`);
  if (!data) return null;
  if (data.status === "pending" && isExpired(data)) return null; // expired
  return { status: data.status as GrantStatus, address: data.address };
}

// ─── Persistent agent tokens ──────────────────────────────────────────────────
//
// After the first approval the agent saves a long-lived token to disk.
// On subsequent runs it verifies the token here (and that the delegation still
// exists). Revoking delegation also deletes all tokens for that address, so
// the next agent run is forced back through the approval flow.

const TOKEN_TABLE = "agent_tokens";

/**
 * Issue a long-lived token for an address after a grant has been approved.
 * Replaces any existing token for the same address+chain so repeated calls
 * (e.g. double-click, retry) don't accumulate multiple valid tokens.
 */
export async function issueAgentToken(address: string, chain: string): Promise<string> {
  const supabase = getSupabase();
  const token = crypto.randomBytes(32).toString("base64url");

  // Delete any prior token for this address before inserting the new one.
  await supabase
    .from(TOKEN_TABLE)
    .delete()
    .eq("address", address.toLowerCase())
    .eq("chain", chain);

  const { error } = await supabase.from(TOKEN_TABLE).insert({
    token_hash: hashGrantCode(token),
    address: address.toLowerCase(),
    chain,
  });
  if (error) throw new Error(`Failed to issue agent token: ${error.message}`);
  return token;
}

/**
 * Verify an agent token. Returns the address + chain on success, null if the
 * token is unknown (already checks hash — caller still needs to confirm the
 * delegation exists).
 */
export async function verifyAgentToken(
  token: string
): Promise<{ address: string; chain: string } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TOKEN_TABLE)
    .select("address, chain")
    .eq("token_hash", hashGrantCode(token))
    .maybeSingle();
  if (error) throw new Error(`Failed to verify agent token: ${error.message}`);
  return data ? { address: data.address, chain: data.chain } : null;
}

/** Delete all tokens for an address — called when delegation is revoked. */
export async function deleteAgentTokensByAddress(
  address: string,
  chain: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TOKEN_TABLE)
    .delete()
    .eq("address", address.toLowerCase())
    .eq("chain", chain);
  if (error) throw new Error(`Failed to delete agent tokens: ${error.message}`);
}
