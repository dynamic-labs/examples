import { NextResponse } from "next/server";
import { geolocation } from "@vercel/functions";
import { isCountryBlocked } from "./geo-blocking";

export interface GeoBlockedResponse {
  error: string;
  message: string;
  country?: string;
}

export function checkGeoBlocking(
  request: Request
): NextResponse<GeoBlockedResponse> | null {
  const geo = geolocation(request);
  const country = geo.country;

  if (isCountryBlocked(country)) {
    return NextResponse.json(
      {
        error: "Access Denied",
        message:
          "This service is not available in your region due to regulatory restrictions.",
        country: country || undefined,
      },
      { status: 403 }
    );
  }

  return null;
}

export function getRequestCountry(request: Request): string | undefined {
  const geo = geolocation(request);
  return geo.country;
}
