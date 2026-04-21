/**
 * Iron Finance Customer Wallets API Route
 *
 * GET /api/iron/customers/[id]/wallets - List wallets for a customer
 *
 * Reference: https://docs.iron.xyz
 */

import { NextRequest } from "next/server";
import { createResponse, handleApiError } from "@/lib/api-response";
import { ironClient } from "@/lib/services/iron";

/**
 * GET /api/iron/customers/[id]/wallets
 * List all wallets for a customer
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await ironClient.listWallets(id);
    return createResponse(result, 200);
  } catch (error) {
    return handleApiError(error, "iron/customers/wallets/list");
  }
}
