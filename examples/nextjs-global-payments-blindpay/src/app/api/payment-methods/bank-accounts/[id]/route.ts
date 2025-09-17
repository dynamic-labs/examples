import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;
    const body = await request.json();
    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "Bank account ID is required" },
        { status: 400 }
      );
    }

    const token = config.blindpay.apiKey;

    const response = await fetch(
      `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/receivers/${receiverId}/bank-accounts/${accountId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to delete bank account", details: errorData },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bank account deleted successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
