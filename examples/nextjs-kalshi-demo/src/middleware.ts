import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { geolocation } from "@vercel/functions";
import { BLOCKED_COUNTRY_CODES } from "@/lib/geo-blocking";

export function middleware(request: NextRequest) {
  // Skip geo-blocked page to avoid infinite loop
  if (request.nextUrl.pathname.startsWith("/geo-blocked")) {
    return NextResponse.next();
  }

  // Get geolocation data from the request
  const geo = geolocation(request);
  const country = geo.country;

  // Check if the country is in the blocked list
  if (country && BLOCKED_COUNTRY_CODES.has(country)) {
    // For API routes, return a 403 JSON response
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "Access Denied",
          message:
            "This service is not available in your region due to regulatory restrictions.",
          country,
        },
        { status: 403 }
      );
    }

    // For page requests, rewrite to the geo-blocked page
    const url = request.nextUrl.clone();
    url.pathname = "/geo-blocked";
    url.searchParams.set("country", country);

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
