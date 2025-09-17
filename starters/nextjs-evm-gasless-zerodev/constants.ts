// Contract addresses
export const CONTRACTS = {
  "84532": {
    USD: "0x678d798938bd326d76e5db814457841d055560d0",
  },
} as const;

// Contract ABIs
export const TOKEN_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amountDollars",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function getContractAddress(
  networkId: string | number,
  contractName: string
): `0x${string}` | undefined {
  const networkContracts = (CONTRACTS as Record<string, any>)[networkId];
  if (networkContracts && contractName in networkContracts) {
    return networkContracts[contractName];
  }

  return undefined;
}
