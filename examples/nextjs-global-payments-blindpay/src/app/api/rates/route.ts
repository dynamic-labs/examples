import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import {
  BlindPayQuoteResponse,
  SupportedCurrency,
  CurrencyType,
  Network,
  SUPPORTED_CURRENCIES,
} from "@/types";

async function getStablePayFXQuote(
  from: SupportedCurrency,
  to: SupportedCurrency,
  amount: number,
  currencyType: CurrencyType
): Promise<BlindPayQuoteResponse> {
  const url = `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/quotes/fx`;

  const requestData = {
    from,
    to,
    request_amount: Math.round(amount),
    currency_type: currencyType,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.blindpay.apiKey}`,
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    let errorDetails = `${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.text();
      errorDetails += ` - ${errorBody}`;
    } catch {}

    throw new Error(`API error: ${errorDetails}`);
  }

  const fxData = await response.json();
  return fxData;
}

async function getStablePayFullQuote(
  from: SupportedCurrency,
  to: SupportedCurrency,
  amount: number,
  bankAccountId: string,
  currencyType: CurrencyType,
  coverFees: boolean,
  network: string
): Promise<{
  quote_id?: string;
  amount?: number;
  fee?: number;
  total?: number;
  [key: string]: unknown;
}> {
  const url = `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/quotes`;

  const requestData = {
    bank_account_id: bankAccountId,
    currency_type: currencyType,
    cover_fees: coverFees,
    request_amount: Math.round(amount),
    network: network,
    token: from,
    description: `Convert ${amount} ${from} to ${to}`,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.blindpay.apiKey}`,
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    let errorDetails = `${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.text();
      errorDetails += ` - ${errorBody}`;
    } catch {}
    throw new Error(`API error: ${errorDetails}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") as SupportedCurrency;
    const to = searchParams.get("to") as SupportedCurrency;
    const amount = parseFloat(searchParams.get("amount") || "1000");
    const currencyType = searchParams.get("currency_type") as CurrencyType;
    const coverFees = searchParams.get("cover_fees") === "true";
    const network = searchParams.get("network");
    const bankAccountId = searchParams.get("bank_account_id");

    if (!from || !to) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    if (!SUPPORTED_CURRENCIES.includes(from)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          details: `Unsupported 'from' currency: ${from}. Supported currencies: ${SUPPORTED_CURRENCIES.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    if (!SUPPORTED_CURRENCIES.includes(to)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          details: `Unsupported 'to' currency: ${to}. Supported currencies: ${SUPPORTED_CURRENCIES.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    if (currencyType !== "sender" && currencyType !== "receiver") {
      return NextResponse.json(
        {
          error: "Bad Request",
          details: "currency_type must be either 'sender' or 'receiver'",
        },
        { status: 400 }
      );
    }

    if (amount < 1) {
      return NextResponse.json(
        {
          error: "Bad Request",
          details: "Amount must be at least 1",
        },
        { status: 400 }
      );
    }

    try {
      let quote;
      let quoteType = "fx";

      try {
        quote = await getStablePayFXQuote(from, to, amount, currencyType);
      } catch (fxError) {
        if (fxError instanceof Error && fxError.message.includes("402")) {
          if (!bankAccountId || !network) {
            return NextResponse.json(
              {
                error: "Bank Account and Network Required",
                details:
                  "FX quote failed due to bank account validation. Please provide both bank_account_id and network parameters for full quote or ensure your account has a valid bank account.",
                code: "BANK_ACCOUNT_AND_NETWORK_REQUIRED",
                status: 402,
                solution:
                  "Complete KYC process and add banking information to your account, or provide both bank_account_id and network parameters for full quote",
              },
              { status: 402 }
            );
          }

          try {
            quote = await getStablePayFullQuote(
              from,
              to,
              amount,
              bankAccountId,
              currencyType,
              coverFees,
              network as Network
            );
            quoteType = "full";
          } catch {
            return NextResponse.json(
              {
                error: "Bank Account Validation Failed",
                details:
                  "Both FX quote and full quote failed. Your bank account may need additional verification or funding.",
                code: "BANK_ACCOUNT_VALIDATION_FAILED",
                status: 402,
                solution:
                  "Contact support to verify your bank account status and funding requirements",
              },
              { status: 402 }
            );
          }
        } else {
          throw fxError;
        }
      }

      if (quoteType === "fx") {
        const fxQuote = quote as BlindPayQuoteResponse;
        const rate = fxQuote.result_amount / amount;
        return NextResponse.json({
          from,
          to,
          rate,
          timestamp: Date.now(),
          blindpay_rate: fxQuote.blindpay_quotation / 100,
          commercial_rate: fxQuote.commercial_quotation / 100,
          flat_fee: fxQuote.instance_flat_fee,
          percentage_fee: fxQuote.instance_percentage_fee / 100,
          result_amount: fxQuote.result_amount,
          request_amount: amount,
          quote_type: "fx",
        });
      } else {
        return NextResponse.json({
          from,
          to,
          rate: 1,
          timestamp: Date.now(),
          quote_type: "full",
          full_quote: quote,
        });
      }
    } catch (apiError) {
      throw apiError;
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
