import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { Network } from "@/types/stablepay";

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
      `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/receivers/${receiverId}/blockchain-wallets`,
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
        { error: "Failed to fetch blockchain wallets", details: errorData },
        { status: response.status }
      );
    }

    const wallets = await response.json();

    return NextResponse.json({
      success: true,
      blockchainWallets: wallets || [],
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
      name,
      network,
      address,
      is_account_abstraction,
      signature_tx_hash,
    } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 }
      );
    }

    if (!name || !network) {
      return NextResponse.json(
        { error: "Name and network are required" },
        { status: 400 }
      );
    }

    // For signature-based addition, both signature and address are required
    if (signature_tx_hash && !address) {
      return NextResponse.json(
        { error: "Address is required when using signature-based addition" },
        { status: 400 }
      );
    }

    // For direct addition, address is required
    if (!signature_tx_hash && !address) {
      return NextResponse.json(
        { error: "Address is required for direct wallet addition" },
        { status: 400 }
      );
    }

    const token = config.blindpay.apiKey;

    const walletData: {
      name: string;
      network: Network;
      is_account_abstraction: boolean;
      signature_tx_hash?: string;
      address: string;
    } = {
      name,
      network: network as Network,
      is_account_abstraction: is_account_abstraction || false,
      address, // Always include address
    };

    // Add signature if using signature-based addition
    if (signature_tx_hash) {
      walletData.signature_tx_hash = signature_tx_hash;
    }

    const response = await fetch(
      `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/receivers/${receiverId}/blockchain-wallets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(walletData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      return NextResponse.json(
        { error: "Failed to create blockchain wallet", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      blockchainWallet: data.blockchain_wallet || data,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
