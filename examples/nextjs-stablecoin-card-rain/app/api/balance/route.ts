import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedUser } from "@/lib/dynamic/dynamic-auth";
import { userCreditBalance } from "@/lib/rain/methods";

export const GET = withAuth(
  async (_req: NextRequest, { user }: { user: AuthenticatedUser }) => {
    const { metadata } = user;
    const rainCard = metadata?.rainCard;

    if (!rainCard) {
      return NextResponse.json({ error: "No card found" }, { status: 404 });
    }

    const balance = await userCreditBalance(rainCard.userId);
    return NextResponse.json({ balance });
  }
);
