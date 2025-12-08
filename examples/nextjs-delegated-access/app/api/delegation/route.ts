import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleGetDelegationRequest } from "./handler";

/**
 * GET handler for delegation endpoint
 *
 * Wraps the delegation handler in error handling to ensure
 * all errors are caught and returned as proper HTTP responses
 */
export async function GET(request: NextRequest) {
  try {
    return await handleGetDelegationRequest(request);
  } catch (error) {
    console.error("Error fetching delegation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
