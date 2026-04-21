/**
 * Iron Finance Customer Autoramps API Route
 *
 * GET /api/iron/customers/[id]/autoramps - List all autoramps for a customer
 *
 * Reference: https://docs.iron.xyz/reference-sandbox/autoramp/list-autoramps-for-a-customer
 */

import { NextRequest } from "next/server";
import { createResponse, handleApiError } from "@/lib/api-response";
import { ironClient } from "@/lib/services/iron";

/**
 * GET /api/iron/customers/[id]/autoramps
 * List all onramp and offramp transactions for a customer
 * Uses the Iron /autoramps endpoint which returns both types
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch autoramps using ironClient
    const result = await ironClient.listAutoramps(id);

    // Iron API returns { items: [...], cursor: "...", prev_cursor: "..." }
    const transactions = (result.items || []).map((item: any) => ({
      ...item,
      type: item.kind?.toLowerCase() || "unknown", // Convert "Onramp" to "onramp", "Offramp" to "offramp"
    })).sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // Most recent first
    });

    return createResponse(transactions, 200);
  } catch (error) {
    return handleApiError(error, "iron/customers/autoramps/list");
  }
}
