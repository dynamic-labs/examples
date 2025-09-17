# Dynamic Stablecoin Debit Card Demo

A seamless stablecoin backed debit card experience powered by **Dynamic's** embedded wallets. Create wallets instantly with social logins, enjoy gasless transactions, and get a virtual Visa debit card - all without any crypto knowledge.

![Dynamic Stablecoin Debit Card Demo](/public/preview-2.png)

## 🌟 Features

### 🔐 **Dynamic Embedded Wallets**

- **Email & Social Logins**: Create wallets instantly using email, Google, Discord, and other social providers
- **Smart Wallets**: Enhanced wallets with smart contract capabilities for improved user experience
- **Gasless Transactions**: No need to hold native tokens or worry about gas fees
- **Multi-chain Support**: Switch between supported networks within the same wallet

### 🏦 **Virtual Card Integration**

- **Instant Virtual Debit Cards**: Get a virtual Visa debit card automatically upon application approval
- **Real Card Details**: Access actual card numbers, CVV, and expiration dates for testing
- **Secure Encryption**: Card details are encrypted and only viewable when authenticated
- **Streamlined KYC**: Simplified application process integrated with Dynamic's user management

### 💳 **Card Management**

- **Add Funds**: Deposit USDC from your wallet to your debit card
- **View Transactions**: Track all deposits, withdrawals, and spending activity
- **Balance**: See your available card balance and wallet balances
- **Copy Card Details**: Easily copy card numbers and CVV

### 🚰 **Test Token Faucet**

- **Free rUSDC**: Get $100 in test USDC tokens with one click
- **Multi-network**: Works on both Ethereum Sepolia and Base Sepolia
- **Instant Funding**: Tokens appear in your wallet after minting

## 🔗 Supported Networks

### Ethereum Sepolia

- **Chain ID**: 11155111
- **rUSDC Contract**: `0x6CE0D9aEBB683AbbEc9bfbF82D35d4E92CfEC12B`

### Base Sepolia

- **Chain ID**: 84532
- **rUSDC Contract**: `0x10b5Be494C2962A7B318aFB63f0Ee30b959D000b`

## 🚀 Getting Started

### 1. **Connect Your Wallet**

- Click "Get Started" on the homepage
- Choose your preferred login method
- Your embedded wallet will be created automatically

### 2. **Apply for a Card**

- Fill out the application form with test information
- Submit your application (it will be auto-approved for the demo)
- Your virtual debit card will be created instantly

### 3. **Fund Your Card**

- Use the faucet to get $100 in test rUSDC tokens
- Click "Add Funds" on your card to deposit tokens
- Choose an amount and confirm the transaction

### 4. **View Your Card Details**

- Click the "View Details" button to see your card information
- Copy card numbers and CVV for testing purposes
- Use these details in any payment system that accepts Visa (demo only)

### 5. **Manage Your Funds**

- Monitor your card balance and transaction history
- Withdraw funds back to your wallet when needed (coming soon)
- Switch between networks to test multi-chain functionality

## 🛠 Technical Architecture

### Dynamic-Powered Authentication Flow

1. **Dynamic SDK Integration**: Seamlessly handles wallet creation and user authentication
2. **JWT Verification**: Secure token validation for API access powered by Dynamic
3. **Unified Metadata Storage**: User and card data managed in Dynamic's metadata system

### Smart Wallet Features

- **Account Abstraction**: Simplified user experience with smart contract capabilities
- **Gasless Transactions**: Users don't need to hold native tokens for fees
- **Enhanced Functionality**: Regular wallets enhanced with smart contract features

### Card Issuance Process

1. **KYC Application**: User submits test information through the application form
2. **Integrated Processing**: Application data is processed through the integrated card issuance system
3. **Automatic Approval**: Demo applications are instantly approved
4. **Card Creation**: Virtual debit card is generated with real card details
5. **Dynamic Metadata**: Card information is seamlessly stored in user's Dynamic profile

### Multi-chain Support

- **Network Switching**: Seamless switching between Ethereum and Base Sepolia
- **Contract Deployment**: rUSDC contracts deployed on both networks
- **Unified Interface**: Same user experience across different chains

## 🔧 Development

### Prerequisites

- Node.js 18+ and pnpm
- Dynamic Environment ID (get one at [dynamic.xyz](https://app.dynamic.xyz))
- Card issuance API credentials

### Environment Setup

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .example.env .env.local

# Add your Dynamic Environment ID
NEXT_PUBLIC_DYNAMIC_ENV_ID=your_dynamic_env_id_here
DYNAMIC_ENV_ID=your_api_key_here

# Add Rain API credentials
RAIN_API_BASE_URL=your_rain_api_url
RAIN_API_KEY=your_rain_api_key

# Add Google Client ID (for address autofill)
GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Running the Demo

```bash
# Start the development server
pnpm dev

# Open in browser
open http://localhost:3000
```

## 📚 Key Components

### Frontend Components

- **`DynamicCard`**: Main card interface with balance and transaction management
- **`ApplicationForm`**: KYC form for card applications
- **`StablecoinFaucet`**: Test token minting interface
- **`FundCard`** & **`WithdrawFunds`**: Card funding and withdrawal modals

### API Routes

- **`/api/apply`**: Processes card applications and creates cards
- **`/api/balance`**: Retrieves card and wallet balances
- **`/api/card-details`**: Fetches encrypted card details
- **`/api/transactions`**: Returns transaction history
- **`/api/withdrawal`**: Processes withdrawal requests

### Hooks & Utilities

- **`useMintTokens`**: Handles test token faucet functionality
- **`useDepositToken`**: Manages card funding transactions
- **`useWithdrawAsset`**: Processes card withdrawals
- **`useSwitchChain`**: Network switching functionality

## 🎯 Use Cases

### For Developers

- **Dynamic Integration**: Learn how to build with Dynamic's embedded wallet infrastructure
- **Multi-chain Development**: Experience seamless cross-chain functionality powered by Dynamic
- **Account Abstraction**: See gasless transactions in action with Dynamic's smart wallet features
- **Wallet-as-a-Service**: Understand how to integrate Dynamic's embedded wallet solutions

### For Businesses

- **Financial Product Demos**: Showcase card issuance capabilities
- **User Onboarding**: Demonstrate simplified crypto-to-fiat with debit cards
- **Payment Processing**: Test real-world payment scenarios
- **Customer Experience**: Evaluate user-friendly Web3 interfaces

## 📝 Notes

- **Testnet Only**: This demo uses test networks and test tokens only
- **Dynamic-Powered**: All wallet and user management handled by Dynamic's infrastructure
- **Auto-approval**: KYC applications are automatically approved for demo purposes
- **Real Card Details**: Virtual cards have actual card numbers for testing
- **Rate Limits**: Faucet and some operations may have rate limiting
- **Demo Data**: All user data is for demonstration and testing purposes only

## 🤝 Support

For technical questions or integration support:

- **Dynamic Documentation**: [docs.dynamic.xyz](https://docs.dynamic.xyz)
- **Dynamic Community**: [Join our Slack](https://www.dynamic.xyz/join-slack)
- **Dynamic Support**: Contact through your Dynamic dashboard
