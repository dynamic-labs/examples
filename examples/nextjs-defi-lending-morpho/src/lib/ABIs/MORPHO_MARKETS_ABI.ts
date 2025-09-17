export const MORPHO_MARKETS_ABI = [
  // Supply collateral
  {
    inputs: [
      {
        internalType: "address",
        name: "collateral",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onBehalf",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "maxIterations",
        type: "uint256",
      },
    ],
    name: "supply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Withdraw collateral
  {
    inputs: [
      {
        internalType: "address",
        name: "collateral",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onBehalf",
        type: "address",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "withdraw",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Borrow
  {
    inputs: [
      {
        internalType: "address",
        name: "loanToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onBehalf",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "maxIterations",
        type: "uint256",
      },
    ],
    name: "borrow",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Repay
  {
    inputs: [
      {
        internalType: "address",
        name: "loanToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onBehalf",
        type: "address",
      },
    ],
    name: "repay",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Get user position
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "position",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "borrowed",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "supplied",
            type: "uint128",
          },
        ],
        internalType: "struct Position",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  // Get market parameters
  {
    inputs: [
      {
        internalType: "address",
        name: "loanToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "collateralToken",
        type: "address",
      },
    ],
    name: "market",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "totalBorrowAssets",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "totalBorrowShares",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "totalSupplyAssets",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "totalSupplyShares",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "totalBorrowOnPool",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "totalSupplyOnPool",
            type: "uint128",
          },
          {
            internalType: "uint256",
            name: "lastUpdate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fee",
            type: "uint256",
          },
        ],
        internalType: "struct Market",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
