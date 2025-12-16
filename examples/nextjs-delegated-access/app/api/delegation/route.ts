import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { type AuthenticatedUser, withAuth } from "@/lib/dynamic/dynamic-auth";
import { handleGetDelegationRequest } from "./handler";

/**
 * GET handler for delegation endpoint
 *
 * Protected by Dynamic JWT authentication. Users can only
 * access delegations for their own verified wallet addresses.
 */
export const GET = withAuth(
  async (req: NextRequest, { user }: { user: AuthenticatedUser }) => {
    try {
      return await handleGetDelegationRequest(req, user);
    } catch (error) {
      console.error("Error fetching delegation:", error);
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
