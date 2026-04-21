/**
 * Iron Finance Fiat Address (Bank Account) API Route
 *
 * POST /api/iron/banks - Register a fiat bank address
 *
 * Reference: https://docs.iron.xyz/reference-sandbox/addresses/register-a-fiat-bank-account-for-a-customer
 */

import { NextRequest } from "next/server";
import { createResponse, handleApiError } from "@/lib/api-response";
import {
  ironClient,
  type SimplifiedBankAccountRequest,
} from "@/lib/services/iron";
import { z } from "zod";

const registerBankAccountSchema = z
  .object({
    customer_id: z.string().uuid("Invalid customer ID"),
    currency: z.enum(["USD", "EUR", "GBP", "BRL", "MXN"]),
    account_holder_name: z.string().min(1, "Account holder name is required"),
    // SEPA (EUR)
    iban: z.string().optional(),
    // ACH/Wire (USD)
    routing_number: z.string().optional(),
    account_number: z.string().optional(),
    // Bank info (required)
    bank_name: z.string().min(1, "Bank name is required"),
    bank_country: z
      .string()
      .length(2, "Bank country must be ISO 3166-1 alpha-2 code"),
    // Address fields (required)
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().length(2, "Country must be ISO 3166-1 alpha-2 code"),
    postal_code: z.string().min(1, "Postal code is required"),
    label: z.string().optional(),
    is_third_party: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Either IBAN or routing_number + account_number is required
      return data.iban || (data.routing_number && data.account_number);
    },
    {
      message:
        "Either IBAN (for SEPA) or routing_number + account_number (for ACH/Wire) is required",
    }
  );

/**
 * POST /api/iron/banks
 * Register a fiat bank address for a customer
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validated = registerBankAccountSchema.parse(body);

    const bankRequest: SimplifiedBankAccountRequest = {
      customer_id: validated.customer_id,
      currency: validated.currency,
      account_holder_name: validated.account_holder_name,
      iban: validated.iban,
      routing_number: validated.routing_number,
      account_number: validated.account_number,
      bank_name: validated.bank_name,
      bank_country: validated.bank_country,
      street: validated.street,
      city: validated.city,
      state: validated.state,
      country: validated.country,
      postal_code: validated.postal_code,
      label: validated.label,
      is_third_party: validated.is_third_party,
    };

    const fiatAddress = await ironClient.registerBankAccount(bankRequest);

    return createResponse(fiatAddress, 201);
  } catch (error) {
    return handleApiError(error, "iron/banks/create");
  }
}
