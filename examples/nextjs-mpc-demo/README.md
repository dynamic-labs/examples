# Dynamic TSS-MPC Demo

This project demonstrates the use of Dynamic's TSS-MPC (Threshold Signature Scheme Multi-Party Computation) Embedded Wallets functionality. The application showcases how to integrate Dynamic's MPC wallet capabilities into a React application.

## Prerequisites

Before using this application, you'll need:

1. A Dynamic account with an environment ID
2. TSS-MPC feature flag enabled for your environment (contact Dynamic team)
3. V3 enabled as the default wallet version (toggle within embedded wallet settings)

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Configure your Dynamic environment ID:
   - Create a `.env` file in the project root (you can copy from `.env.example`)
   - Set your Dynamic environment ID in the `.env` file:
     ```
     VITE_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id_here
     ```
   - Alternatively, you can directly edit the value in `src/App.tsx`

### Running the App

```bash
npm run dev
```
