import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { DFLOW_TRADE_API_URL } from "@/lib/constants";

/**
 * Proxy endpoint for DFlow Trade API
 * Keeps the API key server-side
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json(
      { error: "Missing endpoint parameter" },
      { status: 400 }
    );
  }

  searchParams.delete("endpoint");

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (env.DFLOW_API_KEY) {
    headers["x-api-key"] = env.DFLOW_API_KEY;
  }

  const fullUrl = `${DFLOW_TRADE_API_URL}/${endpoint}?${searchParams.toString()}`;

  try {
    const response = await fetch(fullUrl, { headers });
    const data = await response.json();

    if (!response.ok) {
      console.error(
        "[DFlow] API error:",
        response.status,
        JSON.stringify(data)
      );
      return NextResponse.json(
        {
          error: data?.error || data?.msg || data?.message || "DFlow API error",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[DFlow] Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy request to DFlow" },
      { status: 500 }
    );
  }
}
