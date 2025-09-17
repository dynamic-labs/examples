import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { Network, Currency } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fromCurrency,
      toCurrency,
      amount,
      walletAddress,
      useBlindPayPayout,
      approvalTxHash,
      network,
      token,
      currencyType,
      coverFees,
    } = body;

    if (
      !fromCurrency ||
      !toCurrency ||
      !amount ||
      !walletAddress ||
      (useBlindPayPayout && !token)
    ) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    if (useBlindPayPayout) {
      if (!config.blindpay.instanceId || !config.blindpay.apiKey) {
        return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 }
        );
      }

      const { bankAccountId } = body;
      if (!bankAccountId) {
        return NextResponse.json(
          { error: "Bank account ID is required for payouts" },
          { status: 400 }
        );
      }

      try {
        const amountInCents = Math.round(amount * 100);

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.blindpay.apiKey}`,
        };

        if (!approvalTxHash) {
          const quoteBody = {
            bank_account_id: bankAccountId,
            currency_type: currencyType,
            cover_fees: coverFees,
            request_amount: amountInCents,
            network: network as Network,
            token: token as Currency,
          };

          const createQuoteResponse = await fetch(
            `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/quotes`,
            {
              headers,
              method: "POST",
              body: JSON.stringify(quoteBody),
            }
          );

          if (!createQuoteResponse.ok) {
            const errorText = await createQuoteResponse.text();
            throw new Error(
              `Quote creation failed: ${createQuoteResponse.status} - ${errorText}`
            );
          }

          const quoteResponse = await createQuoteResponse.json();

          return NextResponse.json({
            success: true,
            step: "quote_created",
            quote: quoteResponse,
            message:
              "Quote created. Please approve tokens on frontend and call again with approvalTxHash.",
          });
        } else {
          const { quoteId } = body;

          if (!quoteId) {
            return NextResponse.json({ error: "Bad Request" }, { status: 400 });
          }

          const payoutBody = {
            quote_id: quoteId,
            sender_wallet_address: walletAddress,
          };

          const executePayoutResponse = await fetch(
            `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/payouts/evm`,
            {
              headers,
              method: "POST",
              body: JSON.stringify(payoutBody),
            }
          );

          if (!executePayoutResponse.ok) {
            const errorText = await executePayoutResponse.text();
            throw new Error(
              `Payout execution failed: ${executePayoutResponse.status} - ${errorText}`
            );
          }

          const payoutResponse = await executePayoutResponse.json();

          return NextResponse.json({
            success: true,
            conversion: {
              id: `conv_blindpay_${payoutResponse.id}`,
              fromCurrency,
              toCurrency,
              fromAmount: amount,
              toAmount: payoutResponse.receiver_amount
                ? payoutResponse.receiver_amount / 100
                : amount,
              status: payoutResponse.status || "processing",
              walletAddress,
              txHash: approvalTxHash,
              timestamp: Date.now(),
              estimatedCompletion:
                payoutResponse.estimated_completion_time ||
                Date.now() + 24 * 60 * 60 * 1000,
              blindpay: {
                quoteId,
                payoutId: payoutResponse.id,
                approvalTxHash,
                fullResponse: payoutResponse,
              },
            },
            message: "Conversion completed successfully",
          });
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: "Conversion failed",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversionId = searchParams.get("id");
    const payoutId = searchParams.get("payoutId");

    if (!conversionId && !payoutId) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    if (!config.blindpay.instanceId || !config.blindpay.apiKey) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    if (payoutId) {
      try {
        const response = await fetch(
          `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/payouts/${payoutId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.blindpay.apiKey}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Payout status query failed: ${response.status} - ${errorText}`
          );
        }

        const payoutData = await response.json();

        return NextResponse.json({
          success: true,
          payout: payoutData,
          conversion: {
            id: conversionId || `conv_blindpay_${payoutId}`,
            status: payoutData.status || "processing",
            blindpay: {
              payoutId,
              ...payoutData,
            },
          },
        });
      } catch (error) {
        return NextResponse.json(
          {
            error: "Failed to fetch payout status",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
