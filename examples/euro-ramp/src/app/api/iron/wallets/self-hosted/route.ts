/**
 * Iron Finance Self-Hosted Wallet API Route
 *
 * POST /api/iron/wallets/self-hosted - Register a self-hosted wallet address
 *
 * Self-hosted wallets are managed by the user (they hold their own keys).
 * Requires signature proof of ownership to register.
 *
 * Reference: https://docs.iron.xyz
 */

import { NextRequest } from "next/server";
import { createResponse, handleApiError } from "@/lib/api-response";
import {
  ironClient,
  type RegisterSelfHostedAddressRequest,
} from "@/lib/services/iron";
import { z } from "zod";

const registerWalletSchema = z.object({
  customer_id: z.string().uuid("Invalid customer ID"),
  blockchain: z.enum([
    "Ethereum",
    "Solana",
    "Polygon",
    "Arbitrum",
    "Base",
    "Stellar",
    "Citrea",
  ]),
  address: z.string().min(1, "Wallet address is required"),
  signature: z.string().min(1, "Signature is required"),
  message: z.string().min(1, "Message is required"),
});

/**
 * POST /api/iron/wallets/self-hosted
 * Register a self-hosted wallet address for a customer
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validated = registerWalletSchema.parse(body);

    const walletRequest: RegisterSelfHostedAddressRequest = {
      customer_id: validated.customer_id,
      blockchain: validated.blockchain,
      address: validated.address,
      signature: validated.signature,
      message: validated.message,
    };

    const wallet = await ironClient.registerHostedWallet(walletRequest);

    return createResponse(wallet, 201);
  } catch (error) {
    return handleApiError(error, "iron/wallets/self-hosted/create");
  }
}
