export const DOMAIN = {
  sepolia: 0,
  baseSepolia: 6,
  arcTestnet: 26,
} as const;

export const CONTRACTS = {
  gatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
  gatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
  usdc: {
    sepolia: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    arcTestnet: "0x3600000000000000000000000000000000000000",
  },
} as const;
