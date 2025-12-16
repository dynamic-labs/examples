/**
 * Truncates a wallet address for display purposes.
 *
 * @param address - The full wallet address
 * @param start - Number of characters to show at the start (default: 7)
 * @param end - Number of characters to show at the end (default: 5)
 * @returns Truncated address like "0x1234...5678"
 *
 * @example
 * truncateAddress("0x1234567890abcdef1234567890abcdef12345678")
 * // Returns "0x12345...45678"
 */
export function truncateAddress(address: string, start = 7, end = 5): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}
