import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import {
  StablePayPayinQuote,
  StablePayPayin,
  PayinStep,
  Network,
  BlindPayBlockchainWallet,
} from "@/types";

interface PayinQuoteBody {
  blockchain_wallet_id: string;
  currency_type: string;
  cover_fees: boolean;
  request_amount: number;
  payment_method: string;
  token: string;
  payer_rules?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      step,
      amount,
      walletAddress,
      quoteId,
      receiverId,

      paymentMethod,
      token,
      network,
      blockchainWalletId, // New parameter for wallet selection from frontend
    } = body;

    if (!step) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    if (!config.blindpay.instanceId || !config.blindpay.apiKey) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.blindpay.apiKey}`,
    };

    const baseUrl = `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}`;

    if (step === PayinStep.CREATE_RECEIVER) {
      return NextResponse.json(
        {
          error:
            "Receiver creation is now handled by the KYC flow. Please complete KYC verification first.",
        },
        { status: 400 }
      );
    }

    if (step === PayinStep.ADD_WALLET) {
      if (!receiverId || !walletAddress) {
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
      }

      const walletBody = {
        name: "Dynamic Wallet",
        network: network as Network,
        address: walletAddress,
        is_account_abstraction: true,
      };

      const walletResponse = await fetch(
        `${baseUrl}/receivers/${receiverId}/blockchain-wallets`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(walletBody),
        }
      );

      if (!walletResponse.ok) {
        const errorText = await walletResponse.text();
        return NextResponse.json(
          { error: "Failed to add blockchain wallet", details: errorText },
          { status: walletResponse.status }
        );
      }

      const walletData: BlindPayBlockchainWallet = await walletResponse.json();

      return NextResponse.json({
        success: true,
        step: "wallet_added",
        wallet: walletData,
      });
    }

    if (step === PayinStep.CREATE_QUOTE) {
      if (!amount || !receiverId || !blockchainWalletId) {
        return NextResponse.json(
          {
            error:
              "Bad Request: amount, receiverId, and blockchainWalletId are required",
          },
          { status: 400 }
        );
      }

      // Use the blockchainWalletId from the frontend instead of fetching
      const quoteBody: PayinQuoteBody = {
        blockchain_wallet_id: blockchainWalletId,
        currency_type: "sender",
        cover_fees: config.blindpayDefaults.coverFees,
        request_amount: Math.round(amount * 100), // Convert to cents
        payment_method: paymentMethod || config.blindpayDefaults.paymentMethod,
        token: token || config.blindpayDefaults.stablecoinToken,
      };

      // Add payer rules if needed (for PIX and other specific payment methods)
      if (paymentMethod === "pix") {
        // You can add specific PIX payer rules here if needed
        // quoteBody.payer_rules = { pix_allowed_tax_ids: ['...'] };
      }

      const quoteResponse = await fetch(`${baseUrl}/payin-quotes`, {
        method: "POST",
        headers,
        body: JSON.stringify(quoteBody),
      });

      if (!quoteResponse.ok) {
        const errorText = await quoteResponse.text();
        return NextResponse.json(
          { error: "Failed to create payin quote", details: errorText },
          { status: quoteResponse.status }
        );
      }

      const quoteData: StablePayPayinQuote = await quoteResponse.json();

      return NextResponse.json({
        success: true,
        step: "quote_created",
        quote: quoteData,
        blockchainWalletId: blockchainWalletId,
      });
    }

    if (step === PayinStep.INITIATE_PAYIN) {
      if (!quoteId) {
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
      }

      const payinBody = {
        payin_quote_id: quoteId,
      };

      const payinResponse = await fetch(`${baseUrl}/payins/evm`, {
        method: "POST",
        headers,
        body: JSON.stringify(payinBody),
      });

      if (!payinResponse.ok) {
        const errorText = await payinResponse.text();
        return NextResponse.json(
          { error: "Failed to initiate payin", details: errorText },
          { status: payinResponse.status }
        );
      }

      const payinData: StablePayPayin = await payinResponse.json();

      return NextResponse.json({
        success: true,
        step: "payin_initiated",
        payin: payinData,
        bankingDetails: payinData.blindpay_bank_details,
        memoCode: payinData.memo_code,
      });
    }

    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!config.blindpay.instanceId || !config.blindpay.apiKey) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const receiverId = searchParams.get("receiver_id");
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";

    const queryParams = new URLSearchParams();
    queryParams.append("limit", limit);
    queryParams.append("offset", offset);
    if (receiverId) queryParams.append("receiver_id", receiverId);

    const url = `${config.blindpay.apiUrl}/instances/${
      config.blindpay.instanceId
    }/payins?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.blindpay.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      payins: data.data || [],
      pagination: data.pagination || {},
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
