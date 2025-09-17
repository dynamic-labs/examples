export const formatAddress = (address: string, containerWidth?: number) => {
  if (!address) return "";

  // If no container width specified, use default truncation
  if (!containerWidth) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Rough character width estimation for font-mono text-sm (~8px per char)
  const charWidth = 8;
  const availableChars = Math.floor(containerWidth / charWidth) - 3; // -3 for "..."

  if (availableChars >= address.length) {
    return address; // Full address fits
  }

  if (availableChars <= 8) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`; // Minimum viable
  }

  // Dynamic split - favor showing more of the beginning
  const startChars = Math.ceil(availableChars * 0.6);
  const endChars = availableChars - startChars;

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
