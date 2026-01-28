/**
 * Geo-blocking configuration for restricted jurisdictions
 *
 * These countries are blocked due to regulatory requirements, sanctions,
 * or other legal restrictions.
 */

// Single source of truth: Array of [countryCode, countryName] tuples
const BLOCKED_COUNTRIES = [
  ["AF", "Afghanistan"],
  ["DZ", "Algeria"],
  ["AO", "Angola"],
  ["AU", "Australia"],
  ["BY", "Belarus"],
  ["BE", "Belgium"],
  ["BO", "Bolivia"],
  ["BG", "Bulgaria"],
  ["BF", "Burkina Faso"],
  ["CM", "Cameroon"],
  ["CA", "Canada"],
  ["CF", "Central African Republic"],
  ["CI", "Côte d'Ivoire"],
  ["CN", "China"],
  ["CD", "Democratic Republic of the Congo"],
  ["CU", "Cuba"],
  ["ET", "Ethiopia"],
  ["FR", "France"],
  ["HT", "Haiti"],
  ["IR", "Iran"],
  ["IQ", "Iraq"],
  ["IT", "Italy"],
  ["KE", "Kenya"],
  ["KP", "North Korea"],
  ["LA", "Laos"],
  ["LB", "Lebanon"],
  ["LY", "Libya"],
  ["ML", "Mali"],
  ["MC", "Monaco"],
  ["MM", "Myanmar (Burma)"],
  ["MZ", "Mozambique"],
  ["NA", "Namibia"],
  ["NE", "Niger"],
  ["NI", "Nicaragua"],
  ["PL", "Poland"],
  ["RU", "Russia"],
  ["SG", "Singapore"],
  ["SO", "Somalia"],
  ["SS", "South Sudan"],
  ["SD", "Sudan"],
  ["CH", "Switzerland"],
  ["SY", "Syria"],
  ["TW", "Taiwan"],
  ["TH", "Thailand"],
  ["UA", "Ukraine"],
  ["AE", "United Arab Emirates"],
  ["GB", "United Kingdom"],
  ["VE", "Venezuela"],
  ["YE", "Yemen"],
  ["ZW", "Zimbabwe"],
] as const;

// Derived: Set of blocked country codes for O(1) lookup
export const BLOCKED_COUNTRY_CODES = new Set<string>(
  BLOCKED_COUNTRIES.map(([code]) => code)
);

// Derived: Country code to name mapping for display
export const COUNTRY_NAMES: Record<string, string> =
  Object.fromEntries(BLOCKED_COUNTRIES);

/**
 * Check if a country code is blocked
 */
export function isCountryBlocked(
  countryCode: string | undefined | null
): boolean {
  if (!countryCode) return false;
  return BLOCKED_COUNTRY_CODES.has(countryCode.toUpperCase());
}

/**
 * Get the display name for a country code
 */
export function getCountryName(countryCode: string): string {
  return COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode;
}
