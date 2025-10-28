# Dynamic Cross-Chain Bridge & Swap Demo

A seamless cross-chain token bridging and swapping experience powered by **Dynamic's** embedded wallets. Swap tokens across different blockchain networks with gasless transactions, real-time route optimization, and comprehensive execution tracking - all without any crypto knowledge.

## 🌟 Features

### 🔐 **Dynamic Embedded Wallets**

- **Email & Social Logins**: Create wallets instantly using email, Google, Discord, and other social providers
- **Smart Wallets**: Enhanced wallets with smart contract capabilities for improved user experience
- **Gasless Transactions**: No need to hold native tokens or worry about gas fees
- **Multi-chain Support**: Switch between supported networks within the same wallet

### 🌉 **Cross-Chain Bridging & Swapping**

- **Multi-Chain Support**: Bridge and swap tokens across Ethereum, Polygon, Arbitrum, Optimism, Base, and Avalanche
- **Route Optimization**: Automatic route finding with multiple options for best rates and lowest fees
- **Real-time Execution**: Live tracking of cross-chain transaction progress with detailed step-by-step updates
- **Background Execution**: Move long-running transactions to background while maintaining progress tracking

### 💱 **Advanced Swap Features**

- **Token Discovery**: Browse and select from thousands of supported tokens across all networks
- **Balance Integration**: Real-time token balance display with "Max" button for easy amount selection
- **Price Impact Protection**: Built-in slippage protection and price impact warnings
- **Exchange Rate Updates**: Automatic handling of exchange rate changes during execution

### 📊 **Execution Management**

- **Route Comparison**: Compare multiple available routes with different costs and execution times
- **Progress Tracking**: Real-time monitoring of each step in the cross-chain process
- **Transaction History**: View all transaction hashes with direct links to blockchain explorers
- **Resume Capability**: Resume paused or failed transactions from where they left off

## 🚀 Getting Started

### 1. **Connect Your Wallet**

- Click "Get Started" on the homepage
- Choose your preferred login method (email, Google, Discord, etc.)
- Your embedded wallet will be created automatically

### 2. **Select Your Swap**

- Choose your source chain and token from the "From" section
- Select your destination chain and token from the "To" section
- Enter the amount you want to swap (use "Max" for your full balance)

### 3. **Find Optimal Routes**

- Click "Get Routes" to find the best available paths
- Compare different routes based on cost, time, and steps required
- Select your preferred route from the available options

### 4. **Execute Your Swap**

- Click "Execute Swap" to begin the cross-chain transaction
- Monitor real-time progress as the swap moves through each step
- View transaction hashes and explorer links for each step

### 5. **Track Progress**

- Watch as your transaction progresses across different chains
- Use "Move to Background" for long-running transactions
- Resume paused transactions or stop execution if needed

## 🛠 Technical Architecture

### Dynamic-Powered Authentication Flow

1. **Dynamic SDK Integration**: Seamlessly handles wallet creation and user authentication
2. **JWT Verification**: Secure token validation for API access powered by Dynamic
3. **Unified Metadata Storage**: User and transaction data managed in Dynamic's metadata system

### Cross-Chain Infrastructure

- **Route Aggregation**: Intelligent route finding across multiple bridges and DEXs
- **Multi-Step Execution**: Complex cross-chain transactions broken down into manageable steps
- **State Management**: Persistent execution state with resume capabilities
- **Error Handling**: Comprehensive error recovery and user feedback

### Real-time Execution Tracking

1. **Step Monitoring**: Track each individual step in the cross-chain process
2. **Status Updates**: Real-time status updates (PENDING, EXECUTING, DONE, FAILED)
3. **Transaction Links**: Direct links to blockchain explorers for each transaction
4. **Progress Visualization**: Clear visual indicators of execution progress

## 🔧 Development

### Prerequisites

- Node.js 18+ and bun
- Dynamic Environment ID (get one at [dynamic.xyz](https://app.dynamic.xyz))
- Cross-chain bridge API access

### Environment Setup

```bash
# Install dependencies
bun install

# Copy environment template
cp .example.env .env.local

# Add your Dynamic Environment ID
NEXT_PUBLIC_DYNAMIC_ENV_ID=your_dynamic_env_id_here
DYNAMIC_ENV_ID=your_api_key_here

# Add bridge API credentials (optional)
NEXT_PUBLIC_LIFI_API_KEY=your_lifi_api_key_here
```

### Running the Demo

```bash
# Start the development server
bun dev

# Open in browser
open http://localhost:3000
```

## 📚 Key Components

### Frontend Components

- **`MultiChainSwap`**: Main swap interface with state management and execution flow
- **`SwapForm`**: Token and chain selection with balance integration
- **`RouteDisplay`**: Route comparison and selection interface
- **`ExecutionDisplay`**: Real-time execution tracking and control
- **`ActionButtons`**: Context-aware action buttons for different states

### Core Libraries

- **`@lifi/sdk`**: Cross-chain routing and execution engine
- **`@dynamic-labs/sdk-react-core`**: Dynamic wallet integration
- **`wagmi`**: Ethereum wallet connection and interaction
- **`@tanstack/react-query`**: Data fetching and caching

### Hooks & Utilities

- **`useTokenBalances`**: Real-time token balance fetching via Dynamic
- **`useChainId`**: Current network detection and switching
- **`useSyncWagmiConfig`**: Wallet configuration synchronization
- **`getExplorerUrl`**: Blockchain explorer URL generation

## 🎯 Use Cases

### For Developers

- **Cross-Chain Development**: Learn how to build cross-chain applications with Dynamic
- **Route Optimization**: Understand advanced routing algorithms and execution strategies
- **Wallet Integration**: Experience seamless wallet-as-a-service with Dynamic's embedded wallets
- **State Management**: See complex transaction state management in action

### For Businesses

- **DeFi Integration**: Showcase cross-chain DeFi capabilities
- **User Onboarding**: Demonstrate simplified cross-chain user experience
- **Payment Processing**: Test real-world cross-chain payment scenarios
- **Customer Experience**: Evaluate user-friendly Web3 interfaces

### For Users

- **Cross-Chain Trading**: Swap tokens across different blockchain networks
- **Asset Migration**: Move assets between chains for better opportunities
- **DeFi Access**: Access DeFi protocols on different chains
- **Cost Optimization**: Find the most cost-effective routes for token transfers

## 🔄 Execution Flow

### 1. **Route Discovery**

- Analyze available bridges and DEXs
- Calculate optimal routes based on cost and time
- Present multiple options to the user

### 2. **Route Selection**

- Display route details including steps, costs, and estimated time
- Allow user to select preferred route
- Validate route parameters and user balance

### 3. **Execution Initiation**

- Begin step-by-step execution of the selected route
- Handle network switching automatically
- Monitor each transaction for completion

### 4. **Progress Tracking**

- Update UI with real-time execution status
- Display transaction hashes and explorer links
- Handle errors and provide recovery options

### 5. **Completion**

- Confirm successful completion of all steps
- Display final transaction details
- Allow user to start new swaps

## 📝 Notes

- **Mainnet Ready**: This demo works with real mainnet networks and tokens
- **Dynamic-Powered**: All wallet and user management handled by Dynamic's infrastructure
- **Gasless Experience**: Users don't need to manage gas tokens for most operations
- **Real Transactions**: All swaps execute real transactions on the selected networks
- **Rate Limits**: Some operations may have rate limiting based on API usage
- **Security**: All transactions are secured by Dynamic's embedded wallet infrastructure

## 🤝 Support

For technical questions or integration support:

- **Dynamic Documentation**: [docs.dynamic.xyz](https://docs.dynamic.xyz)
- **Dynamic Community**: [Join our Slack](https://www.dynamic.xyz/join-slack)
- **Dynamic Support**: Contact through your Dynamic dashboard
- **Cross-Chain Resources**: Explore the bridge ecosystem and available protocols

## 🔒 Security

- **Embedded Wallets**: All private keys are securely managed by Dynamic
- **Smart Contracts**: Leverages battle-tested smart contract infrastructure
- **Audited Bridges**: Uses audited and verified bridge protocols
- **User Control**: Users maintain full control over their assets and transactions

---
