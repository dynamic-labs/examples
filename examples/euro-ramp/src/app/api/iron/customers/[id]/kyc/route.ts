/**
 * Iron Finance KYC API Routes
 *
 * POST /api/iron/customers/[id]/kyc - Start KYC verification
 * GET /api/iron/customers/[id]/kyc - Get KYC status
 *
 * Reference: https://docs.iron.xyz
 */

import { NextRequest } from "next/server";
import { createResponse, handleApiError } from "@/lib/api-response";
import { ironClient } from "@/lib/services/iron";
import { z } from "zod";

type CustomerParams = Promise<{ id: string }>;

const startKYCSchema = z.object({
  return_url: z.string().url().optional(),
});

/**
 * POST /api/iron/customers/[id]/kyc
 * Start KYC verification for a customer
 */
export async function POST(
  req: NextRequest,
  { params }: { params: CustomerParams }
) {
  try {
    const { id: customer_id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate request body
    const validated = startKYCSchema.parse(body);

    const session = await ironClient.startKYC({
      customer_id,
      return_url: validated.return_url,
    });

    return createResponse(session, 201);
  } catch (error) {
    return handleApiError(error, "iron/customers/kyc/start");
  }
}

/**
 * GET /api/iron/customers/[id]/kyc
 * Get customer's current KYC status
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: CustomerParams }
) {
  try {
    const { id: customer_id } = await params;
    const status = await ironClient.getCustomerKYCStatus(customer_id);
    return createResponse(status, 200);
  } catch (error) {
    return handleApiError(error, "iron/customers/kyc/status");
  }
}
