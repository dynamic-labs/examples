/**
 * Iron Finance Customer Identifications API Route
 *
 * GET /api/iron/customers/[id]/identifications - Get customer identifications
 *
 * Reference: https://docs.iron.xyz
 */

import { NextRequest } from "next/server";
import { createResponse, handleApiError } from "@/lib/api-response";
import { ironClient } from "@/lib/services/iron";

type CustomerParams = Promise<{ id: string }>;

/**
 * GET /api/iron/customers/[id]/identifications
 * Get all identifications for a customer
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: CustomerParams }
) {
  try {
    const { id: customerId } = await params;
    const identifications = await ironClient.getCustomerIdentifications(
      customerId
    );
    return createResponse(identifications, 200);
  } catch (error) {
    return handleApiError(error, "iron/customers/identifications/list");
  }
}
