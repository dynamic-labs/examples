/**
 * Iron Finance Signings API Routes
 *
 * GET /api/iron/customers/[id]/signings - Get required signings
 * POST /api/iron/customers/[id]/signings - Create a signing
 *
 * After KYC approval, customers must sign required documents
 * to become active and be able to register wallets.
 *
 * Reference: https://docs.iron.xyz
 */

import { NextRequest } from "next/server";
import { createResponse, handleApiError } from "@/lib/api-response";
import { ironClient } from "@/lib/services/iron";
import { z } from "zod";

type CustomerParams = Promise<{ id: string }>;

// Transform content_type to handle case variations (url -> Url, text -> Text)
const normalizeContentType = (
  val: string | undefined | null
): "Url" | "Text" => {
  if (!val) return "Url"; // Default to Url
  const lower = val.toLowerCase();
  if (lower === "url") return "Url";
  if (lower === "text") return "Text";
  return "Url"; // Default to Url for unknown values
};

const createSigningSchema = z.object({
  content_id: z.string().uuid("Invalid content ID"),
  content_type: z
    .string()
    .optional()
    .nullable()
    .transform(normalizeContentType),
  signed: z.boolean(),
});

/**
 * GET /api/iron/customers/[id]/signings
 * Get required signings for a customer
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: CustomerParams }
) {
  try {
    const { id: customer_id } = await params;
    const signings = await ironClient.getRequiredSignings(customer_id);
    return createResponse(signings, 200);
  } catch (error) {
    return handleApiError(error, "iron/customers/signings/list");
  }
}

/**
 * POST /api/iron/customers/[id]/signings
 * Create a signing for a customer
 */
export async function POST(
  req: NextRequest,
  { params }: { params: CustomerParams }
) {
  try {
    const { id: customer_id } = await params;
    const body = await req.json();

    // Validate request body
    const validated = createSigningSchema.parse(body);

    const signing = await ironClient.createSigning(customer_id, {
      content_id: validated.content_id,
      content_type: validated.content_type,
      signed: validated.signed,
    });

    return createResponse(signing, 201);
  } catch (error) {
    return handleApiError(error, "iron/customers/signings/create");
  }
}
