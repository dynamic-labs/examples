# Stablecoin to Fiat Converter

A simplified demo application for converting between stablecoins and fiat currencies using Dynamic wallet integration.

## Features

- **Wallet Connection**: Connect using Dynamic wallet integration
- **KYC Verification**: Complete KYC verification
- **Payment Methods**: Add bank accounts and blockchain wallets
- **Conversions**: Convert between stablecoins (USDB) and fiat (USD)
- **Real-time Rates**: Get live exchange rates and quotes

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes for integration
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main application page
├── components/            # Reusable UI components
│   ├── ConversionCard.tsx # Currency conversion interface
│   ├── SelectionModal.tsx # Payment method selection modal
│   ├── SetupProgress.tsx  # User setup progress indicator
│   └── ...                # Other UI components
├── lib/                   # Core functionality
│   ├── config.ts          # Application configuration
│   ├── services/          # Business logic services
│   │   ├── conversionService.ts    # Conversion operations
│   │   └── paymentMethodsService.ts # Payment methods management
│   ├── hooks/             # Custom React hooks
│   │   ├── useConversion.ts        # Conversion state management
│   │   ├── useKYCStatus.ts         # KYC status management
│   │   └── usePaymentMethods.ts    # Payment methods state
│   └── ...                # Other utilities
└── types/                 # TypeScript type definitions
```

## Key Improvements Made

1. **Simplified Architecture**: Broke down the monolithic main page into focused components
2. **Custom Hooks**: Extracted business logic into reusable hooks
3. **Service Layer**: Created service classes for API operations
4. **Component Reusability**: Built reusable components like SelectionModal
5. **Cleaner State Management**: Simplified state handling and removed complex logic
6. **Better Error Handling**: Improved error messages and user feedback
7. **Removed Hardcoding**: Eliminated hardcoded values and fallbacks

## Getting Started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Set up environment variables:

   ```bash
   BLINDPAY_INSTANCE_ID=your_instance_id
   BLINDPAY_API_KEY=your_api_key
   NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_env_id
   ```

3. Run the development server:
   ```bash
   bun run dev
   ```

## Usage

1. Connect your wallet using the Dynamic integration
2. Complete KYC verification
3. Add payment methods (bank account or blockchain wallet)
4. Start converting between currencies

## Technologies Used

- **Next.js 15**: React framework with app router
- **Dynamic**: Wallet connection and user management
- **Wagmi**: Ethereum interactions
- **Tailwind CSS**: Styling
- **TypeScript**: Type safety

## Demo Purpose

This application is designed as a demo to showcase:

- Clean, maintainable code structure
- Proper separation of concerns
- Reusable components and hooks
- Simplified state management
- Production-ready patterns without over-engineering
