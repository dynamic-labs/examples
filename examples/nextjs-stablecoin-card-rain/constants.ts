export const OCCUPATION_OPTIONS = [
  {
    id: "11-1011",
    name: "Chief Executives",
  },
  {
    id: "11-1031",
    name: "Legislators",
  },
  {
    id: "11-2011",
    name: "Advertising and Promotions Managers",
  },
  {
    id: "11-2031",
    name: "Public Relations and Fundraising Managers",
  },
  {
    id: "11-3031",
    name: "Financial Managers",
  },
  {
    id: "11-3051",
    name: "Industrial Production Managers",
  },
  {
    id: "11-3071",
    name: "Transportation, Storage, and Distribution Managers",
  },
  {
    id: "11-9021",
    name: "Construction Managers",
  },
];

export const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

// Contract addresses
export const CONTRACTS = {
  "84532": {
    RUSDC: "0x10b5Be494C2962A7B318aFB63f0Ee30b959D000b",
  },
  "11155111": {
    RUSDC: "0x6CE0D9aEBB683AbbEc9bfbF82D35d4E92CfEC12B",
  },
} as const;

// Contract ABIs
export const RUSDC_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amountDollars_Max100",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const ADMIN_NONCE_ABI = [
  {
    name: "adminNonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export const WITHDRAW_ASSET_ABI = [
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "nonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collateralProxy", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
      { internalType: "uint256", name: "_amountNative", type: "uint256" },
      { internalType: "address", name: "_recipient", type: "address" },
      { internalType: "uint256", name: "_expiresAt", type: "uint256" },
      {
        internalType: "bytes32",
        name: "_executorPublisherSalt",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "_executorPublisherSignature",
        type: "bytes",
      },
      { internalType: "bytes32[]", name: "_adminSalts", type: "bytes32[]" },
      { internalType: "bytes[]", name: "_adminSignatures", type: "bytes[]" },
      { internalType: "bool", name: "_directTransfer", type: "bool" },
    ],
    name: "withdrawAsset",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export function getContractAddress(
  networkId: string | number,
  contractName: string
): string | undefined {
  const networkContracts = (CONTRACTS as Record<string, any>)[networkId];
  if (networkContracts && contractName in networkContracts) {
    return networkContracts[contractName];
  }

  return undefined;
}
