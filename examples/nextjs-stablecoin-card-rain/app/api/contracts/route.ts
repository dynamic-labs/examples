import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedUser } from "@/lib/dynamic/dynamic-auth";
import { userDepositContract } from "@/lib/rain/methods";

export const GET = withAuth(
  async (req: NextRequest, { user }: { user: AuthenticatedUser }) => {
    const chain = req.nextUrl.searchParams.get("chain");
    const { metadata } = user;
    const rainCard = metadata?.rainCard;

    if (!rainCard) {
      return NextResponse.json({ error: "No card found" }, { status: 404 });
    }

    if (!chain) {
      return NextResponse.json({ error: "Chain is required" }, { status: 400 });
    }

    const contracts = await userDepositContract(rainCard.userId);

    const contract = contracts.find(
      (contract) => contract.chainId === Number(chain)
    );

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contract });
  }
);
