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
  date_of_birth: z.string().optional(),
  country_code: z.string().length(2).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
