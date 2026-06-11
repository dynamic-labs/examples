import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { env } from "@/env";

/**
 * Verify webhook signature from Dynamic using HMAC SHA256
 *
 * This function handles the complete webhook verification process:
 * - Retrieves webhook secret from environment variables
 * - Extracts signature from request headers (supports both v1 and v2 headers)
 * - Parses request body as JSON
 * - Verifies signature using constant-time comparison to prevent timing attacks
 *
 * Security considerations:
 * - Uses `crypto.timingSafeEqual()` to prevent timing attacks when comparing signatures
 * - Never exposes the webhook secret in error messages
 * - Validates signature before processing payload to prevent processing malicious requests
 *
 * Production recommendations:
 * - Store DYNAMIC_WEBHOOK_SECRET in a secure secrets manager (AWS Secrets Manager, etc.)
 * - Never commit secrets to version control
 * - Use different secrets for different environments
 * - Monitor failed signature verifications for potential attacks
 *
 * @param request - Next.js request object containing headers and body
 * @returns Result object with success status, payload (if successful), or error details
 *
 * @see https://www.dynamic.xyz/docs/guides/webhooks-signature-validation
 */
export async function verifyWebhookSignature(
  request: NextRequest
): Promise<
  | { success: true; payload: unknown }
  | { success: false; error: string; status: number }
> {
  // Get the webhook secret from environment variables
  // In production, consider using a secrets manager instead
  const webhookSecret = env.DYNAMIC_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("DYNAMIC_WEBHOOK_SECRET is not configured");
    return {
      success: false,
      error: "Webhook secret not configured",
      status: 500,
    };
  }

  // Extract signature from headers
  const signature = request.headers.get("x-dynamic-signature-256");
  if (!signature) {
    console.error("No signature provided in webhook request");
    return {
      success: false,
      error: "No signature provided",
      status: 401,
    };
  }

  // Read the RAW request body once.
  const rawBody = await request.text();

  // Dynamic's docs are inconsistent about what the HMAC covers: the prose says
  // the "raw request body", but their reference code signs `JSON.stringify(payload)`
  // (the re-parsed object), which can differ from the raw bytes. Accept either —
  // both still require the webhook secret, so this doesn't weaken verification.
  const signedCandidates = [rawBody];
  try {
    signedCandidates.push(JSON.stringify(JSON.parse(rawBody)));
  } catch {
    /* body isn't JSON — the raw candidate is all we need */
  }

  // The signature format is: sha256=<hex-encoded-hmac>. Compare in constant time;
  // timingSafeEqual throws on length mismatch, so guard the length first.
  const untrusted = Buffer.from(signature, "ascii");
  const isValid = signedCandidates.some((body) => {
    const expected = Buffer.from(
      `sha256=${crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex")}`,
      "ascii"
    );
    return (
      expected.length === untrusted.length &&
      crypto.timingSafeEqual(expected, untrusted)
    );
  });

  if (!isValid) {
    console.error(
      "Invalid webhook signature (tried raw + canonical body) — verify " +
        "DYNAMIC_WEBHOOK_SECRET matches the webhook's signing secret in the dashboard."
    );
    return { success: false, error: "Invalid signature", status: 401 };
  }

  // Signature verified — now parse the body for the handler.
  try {
    return { success: true, payload: JSON.parse(rawBody) };
  } catch (error) {
    console.error("Failed to parse webhook payload:", error);
    return { success: false, error: "Invalid JSON payload", status: 400 };
  }
}
