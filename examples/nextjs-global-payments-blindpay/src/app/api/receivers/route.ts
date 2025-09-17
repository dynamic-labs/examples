import { config } from "@/lib/config";
import {
  StablePayReceiver,
  BlindPayTOS,
  Currency,
  IdDocType,
  ProofOfAddressDocType,
  PurposeOfTransactions,
  ReceiverType,
  SourceOfFundsDocType,
} from "@/types";
import { NextRequest, NextResponse } from "next/server";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.blindpay.apiKey}`,
  };
}

function validateConfig() {
  if (!config.blindpay.instanceId || !config.blindpay.apiKey) {
    throw new Error("Invalid configuration");
  }
}

async function makeRequest(
  url: string,
  method: string,
  body?: Record<string, unknown>
) {
  const response = await fetch(url, {
    method,
    headers: createHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    validateConfig();

    if (action === "create_tos") {
      if (!data.walletAddress) {
        return NextResponse.json(
          { error: "Wallet address required" },
          { status: 400 }
        );
      }

      const tosData: BlindPayTOS = await makeRequest(
        `${config.blindpay.apiUrl}/e/instances/${config.blindpay.instanceId}/tos`,
        "POST",
        { idempotency_key: generateUUID() }
      );

      const sessionToken = tosData.url.match(/session_token=([^&]+)/)?.[1];
      return NextResponse.json({
        success: true,
        action: "tos_created",
        tos: tosData,
        sessionToken,
      });
    }

    if (action === "update_tos") {
      if (!data.sessionToken || !data.tos_id) {
        return NextResponse.json(
          { error: "Session token and TOS ID required" },
          { status: 400 }
        );
      }

      const tosData: BlindPayTOS = await makeRequest(
        `${config.blindpay.apiUrl}/e/instances/${config.blindpay.instanceId}/tos`,
        "PUT",
        { session_token: data.sessionToken, idempotency_key: generateUUID() }
      );

      return NextResponse.json({
        success: true,
        action: "tos_updated",
        tos: tosData,
      });
    }

    if (action === "create_receiver") {
      const requiredFields = [
        "email",
        "first_name",
        "last_name",
        "tos_id",
        "tax_id",
        "address_line_1",
        "city",
        "state_province_region",
        "postal_code",
        "country",
        "phoneNumber",
        "dateOfBirth",
      ];

      const missingFields = requiredFields.filter((field) => !data[field]);
      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: "Missing required fields", fields: missingFields },
          { status: 400 }
        );
      }

      const baseReceiver = {
        token: data.tos_id,
        type: data.receiverType || ReceiverType.INDIVIDUAL,
        kyc_type: "standard",
        email: data.email,
        tax_id: data.tax_id,
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2,
        city: data.city,
        state_province_region: data.state_province_region,
        country: data.country,
        postal_code: data.postal_code,
        ip_address: "127.0.0.1",
        phone_number: data.phoneNumber.replace(/[^0-9+]/g, ""),
        image_url: "https://dummyimage.com/600x400/000/fff",
        proof_of_address_doc_type: ProofOfAddressDocType.UTILITY_BILL,
        proof_of_address_doc_file: "https://dummyimage.com/600x400/000/fff",
        id_doc_country: data.country,
        id_doc_type: IdDocType.PASSPORT,
        id_doc_front_file: "https://dummyimage.com/600x400/000/fff",
        id_doc_back_file: "https://dummyimage.com/600x400/000/fff",
        external_id: `${data.email}_${Date.now()}`,
        pix_key: null,
        account_number: null,
        routing_number: null,
        account_type: "checking",
        account_class: "individual",
        currency: Currency.USD,
        network: config.blindpayDefaults.network,
      };

      let receiverBody;
      if (data.receiverType === ReceiverType.BUSINESS) {
        receiverBody = {
          ...baseReceiver,
          legal_name: data.companyName,
          alternate_name: data.companyName,
          formation_date: `${data.formationDate}T00:00:00Z`,
          website: data.website || "https://avneesh.tech",
          source_of_funds_doc_type:
            data.sourceOfFunds || SourceOfFundsDocType.BUSINESS_INCOME,
          source_of_funds_doc_file: "https://dummyimage.com/600x400/000/fff",
          purpose_of_transactions: PurposeOfTransactions.BUSINESS_TRANSACTIONS,
          purpose_of_transactions_explanation:
            data.sourceOfFundsExplanation || "Business operations",
          beneficiary_name: data.companyName,
          name: data.companyName,
          incorporation_doc_file: "https://dummyimage.com/600x400/000/fff",
          proof_of_ownership_doc_file: "https://dummyimage.com/600x400/000/fff",
          individual_holding_doc_front_file:
            "https://dummyimage.com/600x400/000/fff",
          owners: [
            {
              first_name: data.first_name,
              last_name: data.last_name,
              role: "beneficial_owner",
              date_of_birth: `${data.dateOfBirth}T00:00:00Z`,
              tax_id: data.tax_id,
              address_line_1: data.address_line_1,
              address_line_2: data.address_line_2,
              city: data.city,
              state_province_region: data.state_province_region,
              country: data.country,
              postal_code: data.postal_code,
              id_doc_country: data.country,
              id_doc_type: IdDocType.PASSPORT,
              id_doc_front_file: "https://dummyimage.com/600x400/000/fff",
              id_doc_back_file: "https://dummyimage.com/600x400/000/fff",
            },
          ],
        };
      } else {
        receiverBody = {
          ...baseReceiver,
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: `${data.dateOfBirth}T00:00:00Z`,
          legal_name: `${data.first_name} ${data.last_name}`,
          beneficiary_name: `${data.first_name} ${data.last_name}`,
          name: `${data.first_name} ${data.last_name}`,
          purpose_of_transactions:
            PurposeOfTransactions.PERSONAL_OR_LIVING_EXPENSES,
          purpose_of_transactions_explanation:
            "Personal financial transactions",
        };
      }

      const receiverData: StablePayReceiver = await makeRequest(
        `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/receivers`,
        "POST",
        receiverBody
      );

      return NextResponse.json({
        success: true,
        action: "receiver_created",
        receiver: receiverData,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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
    validateConfig();

    const searchParams = request.nextUrl.searchParams;
    const receiverId = searchParams.get("id");
    const email = searchParams.get("email");
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";

    if (receiverId) {
      const receiverData = await makeRequest(
        `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/receivers/${receiverId}`,
        "GET"
      );
      return NextResponse.json({ success: true, receiver: receiverData });
    }

    const queryParams = new URLSearchParams();
    queryParams.append("limit", limit);
    queryParams.append("offset", offset);
    if (email) queryParams.append("email", email);

    const data = await makeRequest(
      `${config.blindpay.apiUrl}/instances/${
        config.blindpay.instanceId
      }/receivers?${queryParams.toString()}`,
      "GET"
    );

    return NextResponse.json({
      success: true,
      receivers: data.data,
      pagination: data.pagination,
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
