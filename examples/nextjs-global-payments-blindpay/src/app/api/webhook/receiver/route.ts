import crypto from "crypto";
import { config } from "@/lib/config";

interface ReceiverWebhookData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  kyc_status: string;
  type: string;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  // Read raw body EXACTLY as sent for signature verification
  const rawBody = await request.text();

  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Missing WEBHOOK_SECRET", { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing verification headers", { status: 400 });
  }

  // Optional: protect against replay attacks (default tolerance: 5 minutes)
  const toleranceSeconds = 5 * 60;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const timestampSeconds = Number(svixTimestamp);
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds
  ) {
    return new Response("Timestamp outside tolerance", { status: 400 });
  }

  // Construct signed content and compute expected signature
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const base64Secret = secret.split("_")[1] ?? "";
  let expectedSig = "";
  try {
    const secretBytes = Buffer.from(base64Secret, "base64");
    expectedSig = crypto
      .createHmac("sha256", secretBytes)
      .update(signedContent)
      .digest("base64");
  } catch {
    return new Response("Invalid WEBHOOK_SECRET format", { status: 500 });
  }

  // svix-signature may contain multiple versions (space-delimited), e.g. "v1,abc v2,def"
  const receivedSigs = svixSignature
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.includes(",") ? part.split(",")[1] : part));

  const expectedBuffer = Buffer.from(expectedSig);
  const isValid = receivedSigs.some((sig) => {
    try {
      const receivedBuffer = Buffer.from(sig);
      // Constant-time comparison
      return (
        receivedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
      );
    } catch {
      return false;
    }
  });

  if (!isValid) {
    return new Response("Invalid signature", { status: 400 });
  }

  // Parse JSON only AFTER successful verification
  let webhookData;
  try {
    webhookData = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  // Process the receiver webhook data
  try {
    await processReceiverWebhook(webhookData);
  } catch {
    // Don't return error to webhook sender - just log it
    // This prevents webhook retries for processing errors
  }

  return new Response("OK");
}

async function processReceiverWebhook(webhookData: ReceiverWebhookData) {
  const { id: receiverId, email } = webhookData;

  if (!email || !receiverId) {
    return;
  }

  // Get Dynamic API configuration
  const dynamicApiToken = config.dynamic.apiToken;
  if (!dynamicApiToken) {
    return;
  }

  const environmentId = config.dynamic.environmentId;
  if (!environmentId) {
    return;
  }

  try {
    // Step 1: Filter users by email to get the user's UUID
    const filterParams = new URLSearchParams({
      "filter[filterColumn]": "email",
      "filter[filterValue]": email,
      limit: "1",
    });

    const usersResponse = await fetch(
      `https://app.dynamic.xyz/api/v0/environments/${environmentId}/users?${filterParams}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${dynamicApiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!usersResponse.ok) {
      await usersResponse.text();
      return;
    }

    const usersData = await usersResponse.json();

    if (usersData.count === 0 || !usersData.users.length) {
      return;
    }

    const user = usersData.users[0];
    const userId = user.id;

    // Step 2: Update the user's metadata with receiver ID
    const currentMetadata = (user.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      blindpayReceiverId: receiverId,
    };

    const updateResponse = await fetch(
      `https://app.dynamic.xyz/api/v0/environments/${environmentId}/users/${userId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${dynamicApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: updatedMetadata,
        }),
      }
    );

    if (!updateResponse.ok) {
      await updateResponse.text();
      return;
    }
  } catch (error) {
    throw error; // Re-throw to be caught by the calling function
  }
}
