import { config } from "@/lib/config";
import { PayoutsResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    if (!config.blindpay.instanceId || !config.blindpay.apiKey) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";
    const startingAfter = searchParams.get("starting_after");
    const endingBefore = searchParams.get("ending_before");
    const receiverId = searchParams.get("receiver_id");
    const walletAddress = searchParams.get("wallet_address");

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.blindpay.apiKey}`,
    };

    const baseUrl = `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}`;

    // Fetch payouts and payins in parallel (only fetch payins if receiver_id is provided)
    const [payoutsResponse, payinsResponse] = await Promise.all([
      // Fetch payouts
      fetch(
        `${baseUrl}/payouts?${new URLSearchParams({
          limit,
          offset,
          ...(startingAfter && { starting_after: startingAfter }),
          ...(endingBefore && { ending_before: endingBefore }),
          ...(receiverId && { receiver_id: receiverId }),
        }).toString()}`,
        { headers }
      ),

      // Fetch payins (only if receiver_id is provided)
      receiverId
        ? fetch(
            `${baseUrl}/payins?${new URLSearchParams({
              limit,
              offset,
              receiver_id: receiverId,
            }).toString()}`,
            { headers }
          )
        : Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [] }),
          }),
    ]);

    if (!payoutsResponse.ok) {
      const errorText = await payoutsResponse.text();
      throw new Error(
        `Payouts API error: ${payoutsResponse.status} - ${errorText}`
      );
    }

    if (!payinsResponse.ok) {
      const errorText = await (payinsResponse as Response).text();
      throw new Error(
        `Payins API error: ${
          (payinsResponse as Response).status
        } - ${errorText}`
      );
    }

    const payoutsData: PayoutsResponse = await payoutsResponse.json();
    const payinsData = await payinsResponse.json();

    // Process payouts
    let filteredPayouts = payoutsData.data;
    if (walletAddress) {
      filteredPayouts = payoutsData.data.filter(
        (payout) =>
          payout.sender_wallet_address?.toLowerCase() ===
          walletAddress.toLowerCase()
      );
    }

    const payoutTransactions = filteredPayouts.map((payout) => {
      let status: "processing" | "completed" | "failed" = "processing";

      if (payout.tracking_complete?.step === "completed") {
        status = "completed";
      } else if (
        payout.tracking_transaction?.status === "failed" ||
        payout.tracking_complete?.status === "tokens_refunded" ||
        payout.status === "failed"
      ) {
        status = "failed";
      }

      return {
        id: payout.id,
        type: "payout" as const,
        payoutId: payout.id,
        quoteId: payout.quote_id,
        fromCurrency: payout.token,
        toCurrency: payout.currency,
        fromAmount: payout.sender_amount / 100,
        toAmount: payout.receiver_amount / 100,
        receiverLocalAmount: payout.receiver_local_amount
          ? payout.receiver_local_amount / 100
          : undefined,
        status,
        timestamp: new Date(payout.created_at).getTime(),
        txHash: payout.tracking_transaction?.transaction_hash,
        completedAt: payout.tracking_complete?.completed_at
          ? new Date(payout.tracking_complete.completed_at).getTime()
          : undefined,
        network: payout.network,
        description: payout.description,
        tracking: {
          transaction: payout.tracking_transaction,
          payment: payout.tracking_payment,
          liquidity: payout.tracking_liquidity,
          complete: payout.tracking_complete,
          partner_fee: payout.tracking_partner_fee,
        },
        fees: {
          partner_fee_amount: payout.partner_fee_amount
            ? payout.partner_fee_amount / 100
            : undefined,
          total_fee_amount: payout.total_fee_amount
            ? payout.total_fee_amount / 100
            : undefined,
        },
        recipient: {
          first_name: payout.first_name,
          last_name: payout.last_name,
          legal_name: payout.legal_name,
          account_number: payout.account_number,
          routing_number: payout.routing_number,
          country: payout.country,
          account_type: payout.account_type,
          type: payout.type,
        },
        rawPayout: payout,
      };
    });

    // Process payins
    const filteredPayins = payinsData.data || [];

    // Note: Payins are filtered by receiver_id in the API call, not by wallet address
    // The wallet address filtering happens at the API level for payouts only

    const payinTransactions = filteredPayins.map(
      (payin: Record<string, unknown>) => {
        let status: "processing" | "completed" | "failed" = "processing";

        // Determine payin status based on payin status
        if (payin.status === "completed") {
          status = "completed";
        } else if (
          payin.status === "failed" ||
          payin.status === "cancelled" ||
          payin.status === "refunded"
        ) {
          status = "failed";
        }

        return {
          id: payin.id,
          type: "payin" as const,
          payinId: payin.id,
          quoteId: payin.payin_quote_id,
          fromCurrency: payin.currency || "USD", // Use currency from API
          toCurrency: payin.token || "USDC", // Use token from API
          fromAmount:
            payin.sender_amount && typeof payin.sender_amount === "number"
              ? payin.sender_amount / 100
              : 0, // Convert from cents
          toAmount:
            payin.receiver_amount && typeof payin.receiver_amount === "number"
              ? payin.receiver_amount / 100
              : 0, // Convert from cents
          status,
          timestamp:
            payin.created_at && typeof payin.created_at === "string"
              ? new Date(payin.created_at).getTime()
              : 0,
          completedAt:
            payin.status === "completed" &&
            payin.updated_at &&
            typeof payin.updated_at === "string"
              ? new Date(payin.updated_at).getTime()
              : undefined,
          network: payin.network || "ethereum",
          description: payin.name || `Payin ${payin.id}`,
          memoCode: payin.memo_code,
          bankingDetails: payin.blindpay_bank_details,
          tracking: {
            transaction: payin.tracking_transaction,
            payment: payin.tracking_payment,
            liquidity: payin.tracking_liquidity,
            complete: payin.tracking_complete,
            partner_fee: payin.tracking_partner_fee,
          },
          fees: {
            partner_fee_amount:
              payin.partner_fee_amount &&
              typeof payin.partner_fee_amount === "number"
                ? payin.partner_fee_amount / 100
                : undefined,
            total_fee_amount:
              payin.total_fee_amount &&
              typeof payin.total_fee_amount === "number"
                ? payin.total_fee_amount / 100
                : undefined,
          },
          recipient: {
            first_name: payin.first_name,
            last_name: payin.last_name,
            legal_name: payin.legal_name,
          },
          rawPayin: payin,
        };
      }
    );

    // Combine and sort transactions by timestamp (newest first)
    const allTransactions = [...payoutTransactions, ...payinTransactions].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    return NextResponse.json({
      success: true,
      transactions: allTransactions,
      pagination: {
        payouts: payoutsData.pagination,
        payins: payinsData.pagination || {},
      },
      total: allTransactions.length,
      payoutsCount: payoutTransactions.length,
      payinsCount: payinTransactions.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
