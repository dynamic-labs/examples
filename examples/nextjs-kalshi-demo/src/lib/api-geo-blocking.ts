import { NextResponse } from 'next/server';
import { geolocation } from '@vercel/functions';
import { isCountryBlocked } from './geo-blocking';

/**
 * Response returned when a user is geo-blocked
 */
export interface GeoBlockedResponse {
  error: string;
  message: string;
  country?: string;
}

/**
 * Check if a request is from a blocked country and return appropriate response
 * Use this as a fallback check in API routes (middleware should handle most cases)
 * 
 * @example
 * ```ts
 * export async function GET(request: Request) {
 *   const geoBlockResponse = checkGeoBlocking(request);
 *   if (geoBlockResponse) return geoBlockResponse;
 *   
 *   // Continue with normal handler...
 * }
 * ```
 */
export function checkGeoBlocking(request: Request): NextResponse<GeoBlockedResponse> | null {
  const geo = geolocation(request);
  const country = geo.country;

  if (isCountryBlocked(country)) {
    return NextResponse.json(
      {
        error: 'Access Denied',
        message: 'This service is not available in your region due to regulatory restrictions.',
        country: country || undefined,
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Get the country code from a request's geolocation
 */
export function getRequestCountry(request: Request): string | undefined {
  const geo = geolocation(request);
  return geo.country;
}
