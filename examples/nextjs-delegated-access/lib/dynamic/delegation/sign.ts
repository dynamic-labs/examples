import type { ServerKeyShare } from "@dynamic-labs-wallet/node";
import { delegatedEvmClient } from "@/lib/dynamic/client";
import { delegatedSignMessage } from "@dynamic-labs-wallet/node-evm";
import type { DelegationRecord } from "@/lib/dynamic/delegation/types";

/**
 * Signs a message using a delegated wallet share
 *
 * This function uses the delegated share from a DelegationRecord to sign
 * a message on behalf of the user. The signature is generated using the
 * Dynamic wallet SDK's delegated signing functionality.
 *
 * @param message - The message to sign
 * @param delegation - The delegation record containing the wallet ID, API key, and key share
 * @returns The signature string
 * @throws Error if signing fails
 */
export async function signMessage(
  message: string,
  delegation: DelegationRecord
): Promise<string> {
  const client = delegatedEvmClient();

  console.info(`Signing message...`);

  try {
    const signature = await delegatedSignMessage(client, {
      walletId: delegation.walletId,
      walletApiKey: delegation.walletApiKey,
      keyShare: delegation.delegatedShare as unknown as ServerKeyShare,
      message,
    });

    console.info(`✅ Message signed`);
    return signature;
  } catch (error) {
    console.error("Error signing message:", JSON.stringify(error, null, 2));
    throw error;
  }
}
