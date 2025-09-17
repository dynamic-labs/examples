import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedUser } from "@/lib/dynamic/dynamic-auth";
import { transactions } from "@/lib/rain/methods";

export const GET = withAuth(
  async (_req: NextRequest, { user }: { user: AuthenticatedUser }) => {
    const { metadata } = user;
    const rainCard = metadata?.rainCard;

    if (!rainCard) {
      return NextResponse.json({ error: "No card found" }, { status: 404 });
    }

    const data = await transactions({ userId: rainCard.userId, limit: 2 });
    return NextResponse.json({ transactions: data });
  }
);
