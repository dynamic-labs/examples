import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Dynamic webhook payload structure
 * @see https://dynamic.xyz/docs/developer-dashboard/webhooks/events
 */
interface DynamicWebhookPayload {
  /** Unique message identifier */
  messageId: string;
  /** Event identifier */
  eventId: string;
  /** Event type (e.g., "user.created", "wallet.linked") */
  eventName: string;
  /** ISO timestamp when the event occurred */
  timestamp: string;
  /** Webhook configuration identifier */
  webhookId: string;
  /** User identifier (if applicable) */
  userId?: string;
  /** Environment identifier */
  environmentId: string;
  /** Environment name (e.g., "sandbox", "live") */
  environmentName: string;
  /** Whether this is a redelivery attempt */
  redelivery: boolean;
  /** Event-specific data payload */
  data: Record<string, unknown>;
}

// =============================================================================
// SIGNATURE VERIFICATION
// =============================================================================

/**
 * Verify Dynamic webhook signature using HMAC SHA256
 *
 * @see https://docs.dynamic.xyz/guides/webhooks-signature-validation
 *
 * @param secret - Webhook secret from Dynamic dashboard
 * @param signature - Signature from x-dynamic-signature header
 * @param payload - Raw request body (must match exact structure sent by Dynamic)
 * @returns boolean indicating if signature is valid
 */
function verifySignature({
  secret,
  signature,
  payload,
}: {
  secret: string;
  signature: string;
  payload: unknown;
}): boolean {
  try {
    const payloadSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    const trusted = Buffer.from(`sha256=${payloadSignature}`, "ascii");
    const untrusted = Buffer.from(signature, "ascii");

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(trusted, untrusted);
  } catch {
    return false;
  }
}

// =============================================================================
// WEBHOOK HANDLER
// =============================================================================

/**
 * POST /api/webhooks/dynamic
 *
 * Receives and processes webhooks from Dynamic.
 * Verifies signature before processing if DYNAMIC_WEBHOOK_SECRET is set.
 *
 * Setup in Dynamic Dashboard:
 * 1. Go to Developer Dashboard → Webhooks
 * 2. Add endpoint URL: https://your-domain.com/api/webhooks/dynamic
 * 3. Select events to subscribe to
 * 4. Copy the webhook secret to your environment variables
 *
 * @see https://dynamic.xyz/docs/developer-dashboard/webhooks/overview
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload
    const payload = (await request.json()) as DynamicWebhookPayload;

    // Get signature from header
    const signature = request.headers.get("x-dynamic-signature");

    // Get webhook secret from environment
    const webhookSecret = process.env.DYNAMIC_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret) {
      if (!signature) {
        console.error("[Webhook] Missing x-dynamic-signature header");
        return NextResponse.json(
          { error: "Missing signature" },
          { status: 401 },
        );
      }

      const isValid = verifySignature({
        secret: webhookSecret,
        signature,
        payload,
      });

      if (!isValid) {
        console.error("[Webhook] Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }

      console.log("[Webhook] Signature verified ✓");
    } else {
      console.warn(
        "[Webhook] DYNAMIC_WEBHOOK_SECRET not set - skipping signature verification",
      );
    }

    // Log the webhook event
    console.log("[Webhook] Event received:", {
      eventName: payload.eventName,
      eventId: payload.eventId,
      userId: payload.userId,
      environmentName: payload.environmentName,
      timestamp: payload.timestamp,
      redelivery: payload.redelivery,
    });

    // Log the full payload for debugging
    console.log("[Webhook] Payload:", JSON.stringify(payload, null, 2));

    // TODO: Add your webhook processing logic here
    // Examples:
    // - user.created: Add user to your database
    // - wallet.linked: Update user's wallet info
    // - user.session.created: Track login events
    // - wallet.transferred: Handle wallet transfers

    // Acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/webhooks/dynamic
 *
 * Health check endpoint for the webhook handler.
 * Useful for verifying the endpoint is accessible.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Dynamic webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
