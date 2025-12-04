# Yield integration with Dynamic wallets

A Next.js app that shows how to build DeFi lending interfaces using Dynamic's MPC wallets and Aave V3. Users can supply assets, borrow against collateral, and manage their positions with a smooth, embedded wallet experience.

## Demo

Watch how it works:

[![Dynamic x Aave](https://previews.jumpshare.com/thumb/815bc01b796dd6f1733c957c5af19493727813f4b2dd48fe787a3a5cea5351472ff0defe9c3d8521f7dfef38beb8f49fa0d548230d49f16d9afc889083965993ad72c263ddb76f5c73238ffe4153a11951b0a14e5e8ab00817c5d5725e01db8a)](https://jumpshare.com/share/utqvrZDf5j14mKLHy7Oz)

## What You Can Do

- **Supply assets** to earn yield on your stablecoins
- **Borrow** against your supplied collateral
- **Monitor your positions** and account health in real-time
- **Preview transactions** before signing with built-in simulation

## Getting Started

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd dynamic-yield
   pnpm install
   ```

2. **Set up your environment**

   ```bash
   cp .env.example .env.local
   # Add your Dynamic Environment ID to .env.local
   ```

3. **Start the dev server**

   ```bash
   pnpm run dev
   ```

4. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## Learn More

For a detailed walkthrough of the integration, including code explanations, configuration tips, and troubleshooting:

📖 **[Complete Integration Guide →](https://www.dynamic.xyz/docs/guides/integrations/aave)**
