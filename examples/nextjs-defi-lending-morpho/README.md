# Defi Lending & Borrowing Yield with Dynamic wallets

A comprehensive technical guide for integrating Morpho lending vaults with Dynamic's MPC embedded wallets.

**[📺 Watch Video](https://www.loom.com/share/b1ecee08e478480e92e3662a5b66846d?sid=aa0f3601-6524-4db7-83a6-63ca2388a151)**

## Architecture Overview

The lending flow consists of several modular components:

1. **Dynamic MPC Wallet** - Provides embedded, non-custodial wallets
2. **Morpho Protocol** - Decentralized lending protocol with optimized yields
3. **Morpho GraphQL API** - Real-time vault data and user positions
4. **Custom Hooks** - Encapsulated business logic for data fetching and operations
5. **UI Components** - Reusable, focused components for different interface sections
6. **Constants & Configuration** - Centralized configuration and styling

## Setup and Dependencies

```bash
pnpm install
```

Key dependencies:

```json
{
  "@dynamic-labs/sdk-react-core": "^4.25.3",
  "wagmi": "^2.16.0",
  "viem": "^2.33.0",
  "next": "15.4.1"
}
```

Key imports:

```typescript
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
```

## 1. Dynamic MPC Wallet Integration

Users authenticate and receive an embedded wallet through Dynamic's MPC system:

```typescript
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";

<DynamicWidget />;
```

The wallet provides:

- **Non-custodial security** - Private keys split via MPC
- **Seamless UX** - No browser extensions required
- **Balance tracking** - Real-time token balances

## 2. Project Structure

The codebase follows a modular architecture:

```
src/
├── app/
│   ├── borrow/
│   │   └── page.tsx           # Borrow page
│   ├── earn/
│   │   ├── page.tsx           # Earn page (vaults list)
│   │   └── [vaultId]/
│   │       └── page.tsx       # Individual vault page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── MarketsBalanceDisplay.tsx
│   ├── MarketsForm.tsx
│   ├── MarketsModeSelector.tsx
│   ├── Navigation.tsx
│   └── index.ts
└── lib/
    ├── ABIs/
    │   ├── ERC20_ABI.ts
    │   ├── ERC4626_ABI.ts
    │   ├── MORPHO_MARKETS_ABI.ts
    │   ├── REWARDS_ABI.ts
    │   └── index.ts
    ├── constants.ts           # Contract addresses and configuration
    ├── hooks/
    │   ├── useMarketsData.ts
    │   ├── useMarketsOperations.ts
    │   ├── useRewardsOperations.ts
    │   ├── useVaultDetail.ts
    │   ├── useVaultOperations.ts
    │   ├── useVaultsList.ts
    │   └── index.ts
    ├── providers.tsx
    ├── utils.ts
    └── wagmi.ts
```

## 3. Configuration

All contract addresses and configuration are centralized in `src/lib/constants.ts`:

```typescript
export const CONTRACTS = {
  REWARDS_DISTRIBUTOR: "0x3B14E5C73e0a56D607A8688098326fD4b4292135",
  MORPHO_MARKETS: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
} as const;

export const MARKET_PARAMS = {
  loanToken: "0x4200000000000000000000000000000000000006", // WETH
  collateralToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
  oracle: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
  irm: "0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
  lltv: BigInt("850000000000000000"), // 85%
} as const;

export const NETWORK = {
  CHAIN_ID: 8453,
  NAME: "Base",
} as const;

export const API = {
  MORPHO_GRAPHQL: "https://api.morpho.org/graphql",
} as const;
```

## 4. Custom Hooks

The application uses custom hooks to encapsulate business logic and state management:

### useMarketsData

Fetches and manages markets data from the Morpho GraphQL API:

```typescript
const marketsData = useMarketsData(address);
// Returns: { userAssets, userAssetsUsd, marketName, marketSymbol }
```

### useVaultsList

Manages vaults list data:

```typescript
const vaultsList = useVaultsList();
// Returns: { vaults, loading, error }
```

### useVaultDetail

Fetches detailed vault information:

```typescript
const vaultDetail = useVaultDetail(vaultId);
// Returns: { vault, loading, error }
```

### useMarketsOperations

Handles all market operations (deposit, withdraw, approve):

```typescript
const marketOps = useMarketsOperations(address);
// Returns: { amount, setAmount, handleDeposit, handleWithdraw, handleApprove, ... }
```

### useVaultOperations

Handles vault-specific operations:

```typescript
const vaultOps = useVaultOperations(address);
// Returns: { handleDeposit, handleWithdraw, handleApprove, ... }
```

### useRewardsOperations

Manages reward claiming operations:

```typescript
const rewardsOps = useRewardsOperations();
// Returns: { handleClaimReward, isClaiming, claimError, ... }
```

## 5. Reading Market Data

### Fetch User Position

Get the user's current position in the market:

```typescript
const fetchUserPosition = async (userAddress: string) => {
  try {
    const res = await fetch("https://api.morpho.org/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query GetAllUserPositions($chainId: Int!, $userAddress: String!) {
          vaultPositions(where: {chainId_in: [$chainId], shares_gte: 0, userAddress_in: [$userAddress]}) {
            items {
              state {
                assets
                assetsUsd
              }
              vault { 
                address 
                name 
                symbol 
              }
            }
          }
        }`,
        variables: {
          chainId: 8453, // Base chain ID
          userAddress: userAddress,
        },
      }),
    });

    const json = await res.json();
    const items = json?.data?.vaultPositions?.items;

    const vaultItem = items?.find(
      (item) =>
        item.vault?.address?.toLowerCase() ===
        MORPHO_MARKETS_ADDRESS.toLowerCase()
    );

    if (vaultItem && vaultItem.state) {
      return {
        assets: vaultItem.state.assets,
        assetsUsd: vaultItem.state.assetsUsd,
        vaultName: vaultItem.vault?.name,
        vaultSymbol: vaultItem.vault?.symbol,
      };
    }
  } catch (error) {
    console.error("Failed to fetch user position:", error);
  }
  return null;
};
```

## 6. Contract Interactions

### Reading Balances and Allowances

```typescript
const { address, isConnected } = useAccount();

// Read USDC balance
const { data: usdcBalance } = useReadContract({
  address: MARKET_PARAMS.collateralToken as `0x${string}`,
  abi: ERC20_ABI,
  functionName: "balanceOf",
  args: address ? [address] : undefined,
  query: { enabled: !!address },
});

// Read vault share balance
const { data: vaultBalance } = useReadContract({
  address: CONTRACTS.MORPHO_MARKETS as `0x${string}`,
  abi: ERC4626_ABI,
  functionName: "balanceOf",
  args: address ? [address] : undefined,
  query: { enabled: !!address },
});

// Read allowance
const { data: allowance } = useReadContract({
  address: MARKET_PARAMS.collateralToken as `0x${string}`,
  abi: ERC20_ABI,
  functionName: "allowance",
  args: address ? [address, CONTRACTS.MORPHO_MARKETS] : undefined,
  query: { enabled: !!address },
});
```

### Token Approval

Before depositing, users must approve the vault to spend their tokens:

```typescript
const {
  writeContract: writeApprove,
  isPending: isApproving,
  error: approveError,
} = useWriteContract();

const handleApprove = async (amount: string) => {
  try {
    await writeApprove({
      address: MARKET_PARAMS.collateralToken as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACTS.MORPHO_MARKETS, parseUnits(amount, 6)], // USDC has 6 decimals
    });
  } catch (error) {
    console.error("Approval failed:", error);
  }
};

// Check if approval is needed
const needsApproval = (amount: string) => {
  const parsedAmount = parseUnits(amount || "0", 6);
  return allowance !== undefined && parsedAmount > (allowance as bigint);
};
```

## 7. Deposit Operations

Deposit assets into the Morpho market:

```typescript
const {
  writeContract: writeDeposit,
  isPending: isDepositing,
  error: depositError,
} = useWriteContract();

const handleDeposit = async (amount: string) => {
  try {
    await writeDeposit({
      address: CONTRACTS.MORPHO_MARKETS as `0x${string}`,
      abi: ERC4626_ABI,
      functionName: "deposit",
      args: [parseUnits(amount, 6), address], // assets, receiver
    });
  } catch (error) {
    console.error("Deposit failed:", error);
  }
};
```

## 8. Withdraw Operations

Withdraw assets from the Morpho market:

```typescript
const {
  writeContract: writeWithdraw,
  isPending: isWithdrawing,
  error: withdrawError,
} = useWriteContract();

const handleWithdraw = async (amount: string) => {
  try {
    await writeWithdraw({
      address: CONTRACTS.MORPHO_MARKETS as `0x${string}`,
      abi: ERC4626_ABI,
      functionName: "withdraw",
      args: [
        parseUnits(amount, 6), // assets
        address, // receiver
        address, // owner
      ],
    });
  } catch (error) {
    console.error("Withdraw failed:", error);
  }
};
```

## 9. Rewards Integration

Morpho markets distribute MORPHO tokens as rewards to users who provide liquidity. This integration includes:

### Rewards Contract Configuration

```typescript
const REWARDS_DISTRIBUTOR_ADDRESS = CONTRACTS.REWARDS_DISTRIBUTOR;
```

### Reading Reward Balances

```typescript
// Read user's reward balance
const { data: userRewardBalance } = useReadContract({
  address: CONTRACTS.REWARDS_DISTRIBUTOR as `0x${string}`,
  abi: REWARDS_ABI,
  functionName: "getUserRewardBalance",
  args: address ? [address, CONTRACTS.MORPHO_MARKETS] : undefined,
  query: { enabled: !!address },
});

// Read reward token information
const { data: rewardTokenAddress } = useReadContract({
  address: CONTRACTS.REWARDS_DISTRIBUTOR as `0x${string}`,
  abi: REWARDS_ABI,
  functionName: "getRewardToken",
  args: [CONTRACTS.MORPHO_MARKETS],
});

const { data: rewardTokenSymbol } = useReadContract({
  address: rewardTokenAddress as `0x${string}`,
  abi: ERC20_ABI,
  functionName: "symbol",
  query: { enabled: !!rewardTokenAddress },
});
```

### Claiming Rewards

```typescript
const {
  writeContract: writeClaimReward,
  isPending: isClaiming,
  error: claimError,
} = useWriteContract();

const handleClaimReward = async () => {
  try {
    await writeClaimReward({
      address: CONTRACTS.REWARDS_DISTRIBUTOR as `0x${string}`,
      abi: REWARDS_ABI,
      functionName: "claimReward",
      args: [CONTRACTS.MORPHO_MARKETS],
    });
  } catch (error) {
    console.error("Claim failed:", error);
  }
};
```

### Rewards UI

The interface displays:

- Current reward balance in MORPHO tokens
- Claim button (only shown when rewards > 0)
- Real-time updates after successful claims

## 10. Network Configuration

Base network (Chain ID: 8453):

- **WETH Token**: `0x4200000000000000000000000000000000000006`
- **USDC Token**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Morpho Markets**: `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`
- **Rewards Distributor**: `0x3B14E5C73e0a56D607A8688098326fD4b4292135`
- **Morpho GraphQL API**: `https://api.morpho.org/graphql`

## 11. Transaction Flow Summary

1. User connects via Dynamic MPC wallet
2. Navigate to earn or borrow page
3. Select deposit or withdraw mode
4. Enter the amount to deposit/withdraw
5. Check and handle token approvals (deposit only)
6. Execute market transaction via ERC-4626 interface
7. Display transaction status and updated balances
8. Query GraphQL API for real-time position data

## 12. Getting Started

First, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 13. Key Features

- **ERC-4626 Compliance** - Standard vault interface for deposits/withdrawals
- **Real-time Data** - GraphQL API integration for live market metrics
- **Optimized Yields** - Morpho's lending optimization algorithms
- **Non-custodial** - Dynamic MPC wallets maintain user control
- **Multi-page Navigation** - Separate earn and borrow interfaces
- **Modular Components** - Reusable UI components for different sections

## 14. References

- [Dynamic Documentation](https://docs.dynamic.xyz)
- [Depositing and withdrawing from Morpho vaults](https://docs.morpho.org/build/earn/tutorials/assets-flow)
- [Getting Morpho data](https://docs.morpho.org/build/earn/tutorials/get-data)
- [Morpho rewards tutorials](https://docs.morpho.org/build/earn/tutorials/rewards)
