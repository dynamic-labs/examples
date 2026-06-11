/**
 * Supabase-backed store for delegated wallet credentials, with application-level
 * AES-256-GCM encryption at rest.
 *
 * Framework-agnostic: reads config from process.env and uses only npm packages,
 * so both the Next.js app (webhook handler) and the standalone agent import it.
 *
 * Flow:
 *  - Dynamic's webhook delivers the delegated share + wallet API key, RSA-encrypted
 *    to our public key. The webhook handler decrypts that (see lib/dynamic/delegation/decrypt).
 *  - Before persisting, we re-encrypt the sensitive material with AES-256-GCM using
 *    DELEGATION_ENCRYPTION_KEY so the database never holds plaintext key shares.
 *  - On read we decrypt in memory just long enough to sign.
 *
 * Security notes:
 *  - DELEGATION_ENCRYPTION_KEY and SUPABASE_SERVICE_ROLE_KEY must come from a secrets
 *    manager / env, never hardcoded. For production prefer a KMS/HSM-managed key and
 *    decrypt on-demand (this AES-GCM-from-env approach is a sane demo default).
 *  - The plaintext share is never logged or returned to the browser.
 */
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DELEGATION_CHAIN } from "./constants";

/** Everything needed to sign on behalf of a user's delegated wallet. */
export interface DelegationRecord {
  /** Dynamic user id. */
  userId: string;
  /** Chain identifier (e.g. "EVM"). */
  chain: string;
  /** Dynamic wallet id. */
  walletId: string;
  /** The wallet's EVM address. */
  address: string;
  /** Short, stable account code that maps to this wallet (derived on store; always set on reads). */
  code?: string;
  /** Decrypted MPC key share (Dynamic ServerKeyShare / EcdsaKeygenResult). */
  delegatedShare: unknown;
  /** Decrypted wallet API key for Dynamic delegated signing. */
  walletApiKey: string;
}

/**
 * Derive a short, stable account code from a wallet address. Deterministic
 * (no DB round-trip, stable across re-delegations) and collision-resistant
 * (40 bits). This is the user↔wallet handle the agent resolves against —
 * it is NOT a secret and does not grant access to funds (the signing creds
 * stay encrypted in Supabase, only the server can decrypt them).
 */
export function deriveAccountCode(address: string): string {
  return crypto
    .createHash("sha256")
    .update(address.toLowerCase())
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
}

/** The sensitive subset we encrypt before persisting. */
interface EncryptedSecret {
  delegatedShare: unknown;
  walletApiKey: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use the delegation store"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function getEncryptionKey(): Buffer {
  const hex = process.env.DELEGATION_ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "DELEGATION_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). " +
        "Generate one with: openssl rand -hex 32"
    );
  }
  return Buffer.from(hex, "hex");
}

const TABLE = "delegations";

// PBKDF2-SHA256 work factor for password-derived keys (OWASP 2023 guidance).
const PBKDF2_ITERATIONS = 600_000;

// ─── AES-256-GCM encryption at rest ─────────────────────────────────────────────

/**
 * Derive the AES key for a password-protected ("secured") row.
 *
 * Requires BOTH the server master key AND the wallet's password: the password
 * is stretched with PBKDF2-SHA256, then HMAC'd under the master key. So neither
 * the operator (master key, no password) nor a DB leak (password-derived
 * material, no master key) can decrypt on its own — only the owner who knows
 * the password, running with the server master key, can.
 */
function deriveSecuredKey(password: string, saltB64: string): Buffer {
  const master = getEncryptionKey();
  const salt = Buffer.from(saltB64, "base64");
  const pwKey = crypto.pbkdf2Sync(
    password.normalize("NFKC"),
    salt,
    PBKDF2_ITERATIONS,
    32,
    "sha256"
  );
  return crypto.createHmac("sha256", master).update(pwKey).digest();
}

function encryptSecretWithKey(
  secret: EncryptedSecret,
  key: Buffer
): { ciphertext: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12); // 96-bit nonce, unique per write
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(secret), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

function decryptSecretWithKey(
  row: { secret_ciphertext: string; secret_iv: string; secret_tag: string },
  key: Buffer
): EncryptedSecret {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(row.secret_iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(row.secret_tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(row.secret_ciphertext, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8")) as EncryptedSecret;
}

/** Thrown when a secured wallet is read without (or with a wrong) password. */
export class PasswordRequiredError extends Error {
  constructor(message = "This wallet is password-protected. A correct password is required.") {
    super(message);
    this.name = "PasswordRequiredError";
  }
}

// ─── Store / read / delete ──────────────────────────────────────────────────────

/** Upsert a delegation, encrypting the share + API key before persisting.
 *
 * New rows are stored UNSECURED (master-key encryption only) — the user secures
 * them later by setting a password (see {@link secureDelegation}). A re-delegation
 * resets protection, since the share material changes.
 */
export async function storeDelegation(record: DelegationRecord): Promise<void> {
  const supabase = getSupabase();
  const { ciphertext, iv, tag } = encryptSecretWithKey(
    {
      delegatedShare: record.delegatedShare,
      walletApiKey: record.walletApiKey,
    },
    getEncryptionKey()
  );

  const code = deriveAccountCode(record.address);
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: record.userId,
      chain: record.chain,
      wallet_id: record.walletId,
      address: record.address.toLowerCase(),
      code,
      secret_ciphertext: ciphertext,
      secret_iv: iv,
      secret_tag: tag,
      secret_salt: null,
      secured: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,chain" }
  );

  if (error) throw new Error(`Failed to store delegation: ${error.message}`);
  console.log(
    `✅ Stored encrypted delegation for ${record.address} (${record.chain}) — account code ${code}`
  );
}

interface RawRow {
  user_id: string;
  chain: string;
  wallet_id: string;
  address: string;
  code?: string;
  secret_ciphertext: string;
  secret_iv: string;
  secret_tag: string;
  secret_salt?: string | null;
  secured?: boolean | null;
}

/**
 * Decrypt a row into a full DelegationRecord.
 *
 * Secured rows need the wallet password; legacy/unsecured rows decrypt with the
 * master key alone. A missing/incorrect password throws PasswordRequiredError.
 */
function rowToRecord(row: RawRow, password?: string): DelegationRecord {
  let secret: EncryptedSecret;
  if (row.secured) {
    if (!password) throw new PasswordRequiredError();
    if (!row.secret_salt) {
      throw new Error("Secured row is missing its salt — cannot decrypt.");
    }
    try {
      secret = decryptSecretWithKey(row, deriveSecuredKey(password, row.secret_salt));
    } catch {
      // AES-GCM auth failure ⇒ wrong password (don't leak crypto details).
      throw new PasswordRequiredError("Incorrect password for this wallet.");
    }
  } else {
    secret = decryptSecretWithKey(row, getEncryptionKey());
  }
  return {
    userId: row.user_id,
    chain: row.chain,
    walletId: row.wallet_id,
    address: row.address,
    code: row.code ?? deriveAccountCode(row.address),
    delegatedShare: secret.delegatedShare,
    walletApiKey: secret.walletApiKey,
  };
}

/** Resolve a delegation by its short account code (how the agent picks a user's wallet). */
export async function getDelegationByCode(
  code: string,
  chain: string = DELEGATION_CHAIN,
  password?: string
): Promise<DelegationRecord | undefined> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("chain", chain)
    .maybeSingle();
  if (error) throw new Error(`Failed to read delegation: ${error.message}`);
  return data ? rowToRecord(data as RawRow, password) : undefined;
}

export async function getDelegationByAddress(
  address: string,
  chain: string,
  password?: string
): Promise<DelegationRecord | undefined> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("address", address.toLowerCase())
    .eq("chain", chain)
    .maybeSingle();
  if (error) throw new Error(`Failed to read delegation: ${error.message}`);
  return data ? rowToRecord(data as RawRow, password) : undefined;
}

/**
 * Lightweight existence + protection status for an address — does NOT decrypt,
 * so it works without a password (used by the funding UI / account lookup).
 */
export async function getDelegationStatus(
  address: string,
  chain: string = DELEGATION_CHAIN
): Promise<{ exists: boolean; secured: boolean }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("secured")
    .eq("address", address.toLowerCase())
    .eq("chain", chain)
    .maybeSingle();
  if (error) throw new Error(`Failed to read delegation: ${error.message}`);
  return { exists: Boolean(data), secured: Boolean(data?.secured) };
}

/**
 * Secure a wallet with a password: re-encrypt the stored share under a key
 * derived from the master key + password. Only valid for an unsecured row
 * (the share material itself never changes here). Idempotent guard: securing
 * an already-secured wallet is rejected (re-delegating resets protection).
 */
export async function secureDelegation(
  address: string,
  chain: string,
  password: string
): Promise<void> {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("address", address.toLowerCase())
    .eq("chain", chain)
    .maybeSingle();
  if (error) throw new Error(`Failed to read delegation: ${error.message}`);
  if (!data) throw new Error("No delegation found for this wallet.");

  const row = data as RawRow;
  if (row.secured) {
    throw new Error("This wallet is already password-protected.");
  }

  // Decrypt the current (master-key) secret, then re-encrypt under the password.
  const secret = decryptSecretWithKey(row, getEncryptionKey());
  const salt = crypto.randomBytes(16).toString("base64");
  const { ciphertext, iv, tag } = encryptSecretWithKey(
    secret,
    deriveSecuredKey(password, salt)
  );

  const { error: updateError } = await supabase
    .from(TABLE)
    .update({
      secret_ciphertext: ciphertext,
      secret_iv: iv,
      secret_tag: tag,
      secret_salt: salt,
      secured: true,
      updated_at: new Date().toISOString(),
    })
    .eq("address", address.toLowerCase())
    .eq("chain", chain);
  if (updateError) {
    throw new Error(`Failed to secure delegation: ${updateError.message}`);
  }
}

export async function deleteDelegation(
  userId: string,
  chain: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { error, count } = await supabase
    .from(TABLE)
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .eq("chain", chain);
  if (error) throw new Error(`Failed to delete delegation: ${error.message}`);
  return (count ?? 0) > 0;
}
