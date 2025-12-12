import { decryptMaterials, storeDelegation } from "@/lib/dynamic/delegation";
import type {
  DelegationCreatedEvent,
  PingEvent,
} from "@/lib/dynamic/webhooks/schemas";

/**
 * Handle ping webhook event from Dynamic
 *
 * This is used to verify that the webhook endpoint is working correctly.
 * Dynamic sends this event when you configure or test a webhook in the dashboard.
 */
export async function handlePing(_payload: PingEvent) {
  return { success: true, message: "Pong" };
}

/**
 * Handle wallet.delegation.created webhook event
 *
 * This is triggered when a user creates a delegated wallet through Dynamic's UI.
 *
 * Process:
 * 1. Decrypts the delegated share and wallet API key using RSA-OAEP + AES-GCM hybrid encryption
 * 2. Stores the decrypted materials in Redis (development) or your configured storage
 * 3. Enables server-side delegated operations (signing transactions, etc.)
 *
 * The decrypted share and API key are stored securely and can be retrieved later
 * to perform delegated wallet operations on behalf of the user.
 */
export async function handleDelegationCreated(payload: DelegationCreatedEvent) {
  try {
    console.log("🔐 Decrypting delegation data...");

    // Decrypt the delegated share and wallet API key using hybrid encryption
    // (RSA-OAEP for key exchange, AES-256-GCM for data encryption)
    const { delegatedShare, walletApiKey } = decryptMaterials(
      payload.data.encryptedDelegatedShare,
      payload.data.encryptedWalletApiKey
    );

    // Store the delegation in Redis (development) or configured storage
    // This enables server-side delegated operations like signing transactions
    await storeDelegation({
      userId: payload.data.userId,
      chain: payload.data.chain,
      walletId: payload.data.walletId,
      address: payload.data.publicKey,
      delegatedShare,
      walletApiKey,
    });

    console.log("✅ Successfully processed delegation");
    return { success: true, message: "Delegation created" };
  } catch (error) {
    console.error("❌ Failed to process delegation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
