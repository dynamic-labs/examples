import { NextRequest } from "next/server";
import { createResponse, handleApiError } from "@/lib/api-response";
import { ironClient } from "@/lib/services/iron";
import { z } from "zod";

type CustomerParams = Promise<{ id: string }>;

const startKYCSchema = z.object({
  return_url: z.string().url().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: CustomerParams }
) {
  try {
    const { id: customer_id } = await params;
    const body = await req.json().catch(() => ({}));
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
