/**
 * Iron Finance Customer API Routes
 *
 * POST /api/iron/customers - Create a new customer
 * GET /api/iron/customers - List customers
 *
 * Reference: https://docs.iron.xyz
 */

import { NextRequest } from "next/server";
import { createResponse, handleApiError } from "@/lib/api-response";
import { ironClient, type CreateCustomerRequest } from "@/lib/services/iron";
import { z } from "zod";

const createCustomerSchema = z.object({
  type: z.enum(["individual", "business"]),
  email: z.string().email("Invalid email address"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  business_name: z.string().optional(),
  phone_number: z.string().optional(),
  date_of_birth: z.string().optional(), // YYYY-MM-DD
  country_code: z.string().length(2).optional(), // ISO 3166-1 alpha-2
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listCustomersSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  type: z.enum(["individual", "business"]).optional(),
  kyc_status: z.enum(["not_started", "pending", "approved", "rejected"]).optional(),
});

/**
 * POST /api/iron/customers
 * Create a new customer (individual or business)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validated = createCustomerSchema.parse(body);

    const customerRequest: CreateCustomerRequest = {
      type: validated.type,
      email: validated.email,
      first_name: validated.first_name,
      last_name: validated.last_name,
      business_name: validated.business_name,
      phone_number: validated.phone_number,
      date_of_birth: validated.date_of_birth,
      country_code: validated.country_code,
      metadata: validated.metadata,
    };

    const customer = await ironClient.createCustomer(customerRequest);

    return createResponse(customer, 201);
  } catch (error) {
    return handleApiError(error, "iron/customers/create");
  }
}

/**
 * GET /api/iron/customers
 * List customers with optional filters
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = url.searchParams.get("limit")
      ? parseInt(url.searchParams.get("limit")!, 10)
      : undefined;
    const offset = url.searchParams.get("offset")
      ? parseInt(url.searchParams.get("offset")!, 10)
      : undefined;
    const type = url.searchParams.get("type") as "individual" | "business" | undefined;
    const kyc_status = url.searchParams.get("kyc_status") as
      | "not_started"
      | "pending"
      | "approved"
      | "rejected"
      | undefined;

    // Validate query parameters
    listCustomersSchema.parse({
      limit,
      offset,
      type,
      kyc_status,
    });

    const result = await ironClient.listCustomers({
      limit,
      offset,
      type,
      kyc_status,
    });

    return createResponse(result, 200);
  } catch (error) {
    return handleApiError(error, "iron/customers/list");
  }
}
