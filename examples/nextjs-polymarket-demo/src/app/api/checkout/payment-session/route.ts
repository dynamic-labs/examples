import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = "USD",
      reference,
      customerEmail,
      customerName,
      walletAddress,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount is required and must be greater than 0" },
        { status: 400 }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }

    // Get the base URL for success/failure URLs
    const baseUrl = request.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${baseUrl}/payments/success`;
    const failureUrl = `${baseUrl}/payments/failure`;

    // Create payment session request
    const paymentSessionRequest: Record<string, unknown> = {
      amount: Math.round(amount * 100), // Convert to cents/pence
      currency: currency.toUpperCase(),
      reference: reference || `PAY-${Date.now()}`,
      display_name: "Predictions Market",
      billing: {
        address: {
          country: "US", // Default, can be made dynamic
        },
      },
      customer: {
        name: customerName || "Customer",
        email: customerEmail,
      },
      success_url: successUrl,
      failure_url: failureUrl,
      // Store wallet address in metadata for webhook processing
      metadata: {
        wallet_address: walletAddress || "",
      },
    };

    // Add processing_channel_id if provided
    if (env.CHECKOUT_PROCESSING_CHANNEL_ID) {
      paymentSessionRequest.processing_channel_id =
        env.CHECKOUT_PROCESSING_CHANNEL_ID;
    }

    const apiUrl = env.CHECKOUT_API_URL;

    console.info("[Checkout API]: Creating payment session:", {
      amount: paymentSessionRequest.amount,
      currency: paymentSessionRequest.currency,
      reference: paymentSessionRequest.reference,
    });

    const response = await fetch(`${apiUrl}/payment-sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.CHECKOUT_SECRET_KEY}`,
      },
      body: JSON.stringify(paymentSessionRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Checkout API]: Failed to create payment session:", {
        status: response.status,
        error: errorText,
      });
      return NextResponse.json(
        { error: `Failed to create payment session: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.info(
      "[Checkout API]: Payment session created successfully:",
      data.id
    );

    // Return the full payment session response for Checkout.com Flow
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Checkout API]: Error creating payment session:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create payment session",
      },
      { status: 500 }
    );
  }
}
