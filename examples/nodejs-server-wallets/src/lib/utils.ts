export const formatAddress = (address: string) => {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

/*
 * Generates a block explorer link for a transaction hash on Base Sepolia
 */
export function getTransactionLink(txHash: string): string {
  return `https://sepolia.basescan.org/tx/${txHash}`;
}

/**
 * Generates a block explorer link for an address on Base Sepolia
 */
export function getAddressLink(address: string): string {
  return `https://sepolia.basescan.org/address/${address}`;
}

/**
 * Converts dollar amount to token units (with 6 decimals for USDC)
 */
export function dollarsToTokenUnits(
  dollars: bigint,
  decimals: number = 6
): bigint {
  return dollars * BigInt(10 ** decimals);
}
