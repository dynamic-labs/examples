import { type NextRequest, NextResponse } from "next/server";
import { type AuthenticatedUser, withAuth } from "@/lib/dynamic/dynamic-auth";
import { updateUserMetadata } from "@/lib/dynamic/methods";
import {
  type CreateUserApplicationRequest,
  createCardForUser,
  createUserApplication,
} from "@/lib/rain";

/**
 * API route handler for processing application submissions.
 *
 * This endpoint handles user application submissions with Dynamic JWT authentication.
 * It processes the application data and submits it to the Rain API.
 */
export const POST = withAuth(
  async (req: NextRequest, { user }: { user: AuthenticatedUser }) => {
    try {
      const body = await req.json();

      // Extract wallet address and email from authenticated user
      const walletAddress = user.verified_credentials.find(
        (credential) => credential.wallet_provider === "embeddedWallet"
      )?.address;

      if (!walletAddress) {
        return NextResponse.json(
          { error: "No wallet address found" },
          { status: 400 }
        );
      }

      if (!user.email) {
        return NextResponse.json(
          { error: "Email address is required" },
          { status: 400 }
        );
      }

      // Prepare the Rain API payload
      const payload: CreateUserApplicationRequest = {
        firstName: String(body.firstName),
        lastName: "Approved",
        birthDate: String(body.birthDate),
        nationalId: String(body.nationalId).replace(/\D/g, ""),
        countryOfIssue: "US",
        email: user.email,
        phoneCountryCode: "1",
        phoneNumber: String(body.phoneNumber).replace(/\D/g, ""),
        address: {
          line1: String(body.address.line1),
          line2: body.address.line2 ? String(body.address.line2) : undefined,
          city: String(body.address.city),
          region: String(body.address.region),
          postalCode: String(body.address.postalCode),
          countryCode: String(body.address.countryCode),
        },
        walletAddress,
        // NOTE: For demo purposes, we're using a static IP address
        ipAddress: "192.168.1.1",
        occupation: String(body.occupation),
        annualSalary: String(body.annualSalary),
        accountPurpose: String(body.accountPurpose),
        expectedMonthlyVolume: String(body.expectedMonthlyVolume),
        isTermsOfServiceAccepted: Boolean(body.isTermsOfServiceAccepted),
      };

      // NOTE: For demo purposes, applications are automatically approved
      const appResult = await createUserApplication(payload);

      // NOTE: For demo purposes, cards can be automatically created for approved applications
      const cardResult = await createCardForUser(appResult.id, {
        type: "virtual",
        limit: {
          frequency: "per30DayPeriod",
          amount: Number(body.expectedMonthlyVolume),
        },
      });

      await updateUserMetadata(user.sub, { rainCard: cardResult });
      return NextResponse.json({ ok: true, card: cardResult });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Application submission error:", err);

      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
);
