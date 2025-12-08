import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleSignMessageRequest } from "./handler";

/**
 * POST handler for signing messages with delegated wallets
 *
 * Wraps the sign message handler in error handling to ensure
 * all errors are caught and returned as proper HTTP responses
 */
export async function POST(request: NextRequest) {
  try {
    return await handleSignMessageRequest(request);
  } catch (error) {
    console.error("Error signing message:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
