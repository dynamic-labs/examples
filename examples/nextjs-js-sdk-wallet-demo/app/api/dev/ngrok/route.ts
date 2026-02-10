/**
 * [Dev Utility] Ngrok Tunnel Detection
 *
 * Queries ngrok's local API to find the public HTTPS URL for the
 * current tunnel. Used by the JWT Generator page to auto-fill the
 * JWKS URL for dashboard configuration.
 *
 * This is a dev-only utility — not part of the Dynamic SDK integration.
 *
 * GET /api/dev/ngrok
 */

import { NextResponse } from "next/server";

interface NgrokTunnel {
  public_url: string;
  proto: string;
  config: { addr: string };
}

export async function GET() {
  try {
    // Use 127.0.0.1 explicitly — ngrok binds to IPv4 and `localhost`
    // may resolve to IPv6 (::1) on some systems, causing ECONNREFUSED.
    const res = await fetch("http://127.0.0.1:4040/api/tunnels", {
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "ngrok API returned error" },
        { status: 502 },
      );
    }

    const data = await res.json();
    const tunnels: NgrokTunnel[] = data.tunnels ?? [];

    // Find the HTTPS tunnel
    const httpsTunnel = tunnels.find((t) => t.proto === "https");

    if (!httpsTunnel) {
      return NextResponse.json(
        { error: "No HTTPS tunnel found" },
        { status: 404 },
      );
    }

    const jwksUrl = `${httpsTunnel.public_url}/api/dev/jwks`;

    return NextResponse.json({
      url: httpsTunnel.public_url,
      jwksUrl,
    });
  } catch {
    return NextResponse.json({ error: "ngrok not detected" }, { status: 503 });
  }
}
