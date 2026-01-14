import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

const DFLOW_API_BASE_URL = "https://c.quote-api.dflow.net";

/**
 * Proxy endpoint for DFlow API /order
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

  // Remove our custom endpoint param and forward the rest
  searchParams.delete("endpoint");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  console.log("DFLOW_API_KEY", env.DFLOW_API_KEY);

  if (env.DFLOW_API_KEY) {
    headers["x-api-key"] = env.DFLOW_API_KEY;
  }

  try {
    const response = await fetch(
      `${DFLOW_API_BASE_URL}/${endpoint}?${searchParams.toString()}`,
      { headers }
    );

    const responseJson = await response.json();
    console.log("DFlow API response:", responseJson);

    if (!response.ok) {
      return NextResponse.json({ error: `Error` }, { status: response.status });
    }

    const data = await response.text();
    return NextResponse.json(data);
  } catch (error) {
    console.error("DFlow proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy request to DFlow" },
      { status: 500 }
    );
  }
}
