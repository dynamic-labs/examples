/**
 * Iron Fiat Currencies API Route
 *
 * GET /api/iron/fiatcurrencies - List all fiat currencies supported by Iron
 *
 * Reference: https://docs.iron.xyz (GET /fiatcurrencies)
 */

import { createResponse, handleApiError } from "@/lib/api-response";
import { ironClient } from "@/lib/services/iron";

/**
 * GET /api/iron/fiatcurrencies
 * Returns list of supported fiat currencies (code, name, countries)
 */
export async function GET() {
  try {
    const currencies = await ironClient.listFiatCurrencies();
    return createResponse(currencies, 200);
  } catch (error) {
    return handleApiError(error, "iron/fiatcurrencies");
  }
}
