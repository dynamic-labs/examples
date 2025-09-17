import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { PaymentMethodType, AccountType, AccountClass } from "@/types/stablepay";

interface BankAccountData {
  type: PaymentMethodType;
  name: string;
  beneficiary_name?: string;
  account_class?: AccountClass;
  account_number?: string;
  account_type?: AccountType;
  address_line_1?: string;
  city?: string;
  country?: string;
  routing_number?: string;
  state_province_region?: string;
  postal_code?: string;
  swift_intermediary_bank_swift_code_bic?: string | null;
  swift_intermediary_bank_account_number_iban?: string | null;
  swift_intermediary_bank_name?: string | null;
  swift_intermediary_bank_country?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get("receiverId");

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 }
      );
    }

    const token = config.blindpay.apiKey;

    const response = await fetch(
      `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/receivers/${receiverId}/bank-accounts`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to fetch bank accounts", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      bankAccounts: data || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      receiverId,
      type,
      name,
      beneficiary_name,
      account_number,
      routing_number,
      account_type,
      account_class,
      country,
      address_line_1,
      city,
      state_province_region,
      postal_code,
      swift_intermediary_bank_swift_code_bic,
      swift_intermediary_bank_account_number_iban,
      swift_intermediary_bank_name,
      swift_intermediary_bank_country,
    } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    const token = config.blindpay.apiKey;

    const bankAccountData: BankAccountData = {
      type,
      name,
    };

    if (beneficiary_name) bankAccountData.beneficiary_name = beneficiary_name;
    if (account_class) bankAccountData.account_class = account_class;
    if (account_number) bankAccountData.account_number = account_number;
    if (account_type) bankAccountData.account_type = account_type;
    if (address_line_1) bankAccountData.address_line_1 = address_line_1;
    if (city) bankAccountData.city = city;
    if (country) bankAccountData.country = country;
    if (routing_number) bankAccountData.routing_number = routing_number;
    if (state_province_region)
      bankAccountData.state_province_region = state_province_region;
    if (postal_code) bankAccountData.postal_code = postal_code;
    if (swift_intermediary_bank_swift_code_bic !== undefined)
      bankAccountData.swift_intermediary_bank_swift_code_bic =
        swift_intermediary_bank_swift_code_bic;
    if (swift_intermediary_bank_account_number_iban !== undefined)
      bankAccountData.swift_intermediary_bank_account_number_iban =
        swift_intermediary_bank_account_number_iban;
    if (swift_intermediary_bank_name !== undefined)
      bankAccountData.swift_intermediary_bank_name =
        swift_intermediary_bank_name;
    if (swift_intermediary_bank_country !== undefined)
      bankAccountData.swift_intermediary_bank_country =
        swift_intermediary_bank_country;

    const response = await fetch(
      `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/receivers/${receiverId}/bank-accounts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankAccountData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to create bank account", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      bankAccount: data.bank_account || data,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
