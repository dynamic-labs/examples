import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { type AuthenticatedUser, withAuth } from "@/lib/dynamic/dynamic-auth";
import { handleSignMessageRequest } from "./handler";

/**
 * POST handler for signing messages with delegated wallets
 *
 * Protected by Dynamic JWT authentication. Users can only
 * sign messages for their own verified wallet addresses.
 */
export const POST = withAuth(
  async (req: NextRequest, { user }: { user: AuthenticatedUser }) => {
    try {
      return await handleSignMessageRequest(req, user);
    } catch (error) {
      console.error("Error signing message:", error);
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        },
        { status: 500 }
      );
    }
  }
);
