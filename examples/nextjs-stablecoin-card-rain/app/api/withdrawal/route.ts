import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedUser } from "@/lib/dynamic/dynamic-auth";
import { UserWithdrawalSignatureRequest } from "@/lib/rain/types";
import { userWithdrawalSignature } from "@/lib/rain/methods";

export const POST = withAuth(
  async (req: NextRequest, { user }: { user: AuthenticatedUser }) => {
    const { metadata } = user;
    const rainCard = metadata?.rainCard;

    if (!rainCard) {
      return NextResponse.json({ error: "No card found" }, { status: 404 });
    }

    try {
      // Parse the request body
      const requestBody = await req.json();
      const withdrawalRequest: UserWithdrawalSignatureRequest = {
        chainId: requestBody.chainId,
        token: requestBody.token,
        amount: requestBody.amount.toString(), // Convert number to string
        adminAddress: requestBody.adminAddress,
        recipientAddress: requestBody.recipientAddress,
      };

      // Validate required fields
      if (
        !requestBody.chainId ||
        !requestBody.token ||
        !requestBody.amount ||
        !requestBody.adminAddress ||
        !requestBody.recipientAddress
      ) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      // Call userWithdrawalSignature with the provided data
      const withdrawalData = await userWithdrawalSignature(
        rainCard.userId,
        withdrawalRequest
      );

      return NextResponse.json(withdrawalData);
    } catch (error) {
      console.error("Withdrawal signature request failed:", error);
      return NextResponse.json(
        { error: "Failed to get withdrawal signature" },
        { status: 500 }
      );
    }
  }
);
