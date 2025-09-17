import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedUser } from "@/lib/dynamic/dynamic-auth";
import { cardEncryptedData } from "@/lib/rain/methods";

export const POST = withAuth(
  async (req: NextRequest, { user }: { user: AuthenticatedUser }) => {
    try {
      const { sessionId } = await req.json();

      if (!sessionId) {
        return NextResponse.json(
          { error: "Session ID is required" },
          { status: 400 }
        );
      }

      const { metadata } = user;
      const rainCard = metadata?.rainCard;

      if (!rainCard) {
        return NextResponse.json({ error: "No card found" }, { status: 404 });
      }

      const encryptedData = await cardEncryptedData(rainCard.id, sessionId);
      return NextResponse.json({ encryptedData });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Card details error:", err);

      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
);
