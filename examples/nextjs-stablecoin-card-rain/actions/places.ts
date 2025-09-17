"use server";

const GOOGLE_BASE = "https://maps.googleapis.com/maps/api/place";

export interface PlacesPrediction {
  description: string;
  place_id: string;
}

export async function placesAutocomplete(
  _prev: undefined,
  formData: FormData
): Promise<PlacesPrediction[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return [];

  const input = String(formData.get("q") || "").trim();
  if (input.length < 3) return [];

  const sessionToken = String(formData.get("token") || "");
  const country = String(formData.get("country") || "");
  const params = new URLSearchParams({ input, key });
  if (sessionToken) params.set("sessiontoken", sessionToken);
  if (country) params.set("components", `country:${country}`);

  const url = `${GOOGLE_BASE}/autocomplete/json?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.predictions || []).map((p: any) => ({
    description: p.description,
    place_id: p.place_id,
  }));
}

export interface PlaceDetailsResult {
  line1: string;
  city: string;
  region: string; // 2-letter if possible
  postalCode: string;
  countryCode: string; // ISO-2
}

export async function placeDetails(
  _prev: undefined,
  formData: FormData
): Promise<PlaceDetailsResult | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const placeId = String(formData.get("placeId") || "");
  if (!placeId) return null;
  const sessionToken = String(formData.get("token") || "");

  const fields = ["address_components", "formatted_address"].join(",");
  const params = new URLSearchParams({ place_id: placeId, key, fields });
  if (sessionToken) params.set("sessiontoken", sessionToken);
  const url = `${GOOGLE_BASE}/details/json?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  const components: any[] = data.result?.address_components || [];

  const byType = (type: string) =>
    components.find((c) => (c.types || []).includes(type));

  const streetNumber = byType("street_number")?.short_name || "";
  const route = byType("route")?.short_name || "";
  const line1 = [streetNumber, route].filter(Boolean).join(" ");
  const city =
    byType("locality")?.short_name ||
    byType("sublocality")?.short_name ||
    byType("administrative_area_level_2")?.short_name ||
    "";
  const region = byType("administrative_area_level_1")?.short_name || "";
  const postalCode = byType("postal_code")?.short_name || "";
  const countryCode = byType("country")?.short_name || "";

  return { line1, city, region, postalCode, countryCode };
}
