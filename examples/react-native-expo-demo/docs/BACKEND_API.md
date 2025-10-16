# Backend API Specification

This document describes the backend API requirements for the React Native Expo demo app. The mobile app requires a backend server to handle Coinbase Onramp API calls securely.

## Overview

The backend acts as a secure proxy between the mobile app and Coinbase's Onramp API. This architecture keeps your Coinbase API credentials secure and allows you to implement additional business logic, logging, and validation.

**Architecture Flow:**

```
Mobile App → Your Backend API → Coinbase Onramp API
            ↓
         Dynamic JWT Verification
         Extract User Info (email, phone)
         Add Required Fields
```

### Key Responsibilities

Your backend must:

1. **Verify Authentication**: Validate the Dynamic JWT token
2. **Extract User Data**: Get email and phone number from the authenticated user
3. **Transform Request**: Convert mobile app request format to Coinbase API format
4. **Add Required Fields**: Include `partner_user_ref`, `email`, `phone_number`, and `phone_number_verified_at`
5. **Forward to Coinbase**: Make authenticated request to Coinbase API
6. **Return Response**: Format Coinbase response for mobile app consumption

## Authentication

All API requests from the mobile app include authentication headers:

```typescript
{
  "Authorization": "Bearer <DYNAMIC_JWT_TOKEN>",
  "X-Dynamic-Environment-Id": "<DYNAMIC_ENVIRONMENT_ID>",
  "Content-Type": "application/json"
}
```

### Recommended Authentication Flow

1. Extract the JWT token from the `Authorization` header
2. Extract the Dynamic Environment ID from the `X-Dynamic-Environment-Id` header
3. Verify the JWT token using Dynamic's verification endpoint or SDK
4. Proceed with the request if authentication is valid

## API Endpoints

### POST /coinbase/onramp

Creates a Coinbase Onramp order and returns a payment URL for Apple Pay checkout.

#### Request

**Headers:**

```
Authorization: Bearer <DYNAMIC_JWT_TOKEN>
X-Dynamic-Environment-Id: <DYNAMIC_ENVIRONMENT_ID>
Content-Type: application/json
```

**Body (from Mobile App):**

```typescript
{
  "destinationAddress": string;      // Wallet address to receive crypto
  "destinationNetwork": string;      // Network (e.g., "base", "ethereum")
  "paymentCurrency": string;         // Fiat currency (e.g., "USD")
  "paymentAmount": string;           // Amount in fiat currency
  "purchaseCurrency": string;        // Crypto to purchase (e.g., "USDC", "ETH")
  "purchaseAmount": string;          // Expected crypto amount
  "paymentMethod": string;           // Always "GUEST_CHECKOUT_APPLE_PAY"
  "agreementAcceptedAt": string;     // ISO timestamp
  "isQuote": boolean;                // false for actual orders
  "isSandbox"?: boolean;             // true for testing, false for production
}
```

**Note**: The backend must extract additional required fields from the authenticated user:

- `email`: From Dynamic JWT claims
- `phoneNumber`: From user's verified credentials
- `phoneNumberVerifiedAt`: Timestamp when phone was verified
- `partnerUserRef`: Unique user identifier (use Dynamic user ID)

**Example Request:**

```json
{
  "destinationAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "destinationNetwork": "base",
  "paymentCurrency": "USD",
  "paymentAmount": "100",
  "purchaseCurrency": "USDC",
  "purchaseAmount": "100",
  "paymentMethod": "GUEST_CHECKOUT_APPLE_PAY",
  "agreementAcceptedAt": "2024-01-15T10:30:00.000Z",
  "isQuote": false,
  "isSandbox": true
}
```

#### Response

**Success Response (200):**

```typescript
{
  "success": boolean;               // Always true for successful responses
  "data": {
    "id": string;                   // Order ID from Coinbase
    "paymentUrl": string;           // URL to load in WebView for Apple Pay
    "status": string;               // Order status (e.g., "created")
    "createdAt": string;            // ISO timestamp
    "orderDetails"?: {              // Full order details from Coinbase
      "orderId": string;
      "createdAt": string;
      "updatedAt": string;
      "status": string;
      "destinationAddress": string;
      "destinationNetwork": string;
      "paymentCurrency": string;
      "paymentMethod": string;
      "paymentSubtotal": string;
      "paymentTotal": string;
      "purchaseAmount": string;
      "purchaseCurrency": string;
      "exchangeRate": string;
      "fees": Array<{
        "type": string;
        "amount": string;
        "currency": string;
      }>;
    }
  }
}
```

**Example Success Response:**

```json
{
  "success": true,
  "data": {
    "id": "ord_abc123xyz",
    "paymentUrl": "https://pay.coinbase.com/buy/select-asset/abc123",
    "status": "created",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "orderDetails": {
      "orderId": "ord_abc123xyz",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "status": "created",
      "destinationAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "destinationNetwork": "base",
      "paymentCurrency": "USD",
      "paymentMethod": "GUEST_CHECKOUT_APPLE_PAY",
      "paymentSubtotal": "100.00",
      "paymentTotal": "102.50",
      "purchaseAmount": "100.00",
      "purchaseCurrency": "USDC",
      "exchangeRate": "1.0",
      "fees": [
        {
          "type": "network_fee",
          "amount": "2.50",
          "currency": "USD"
        }
      ]
    }
  }
}
```

**Error Response (400/500):**

```typescript
{
  "error": {
    "message": string;
    "code"?: string;
    "details"?: any;
  }
}
```

## Coinbase API Integration

### Getting Started with Coinbase Onramp API

1. **Sign up for Coinbase Cloud**: https://cloud.coinbase.com/
2. **Enable Onramp API** in your project settings
3. **Generate API credentials** (API Key and Secret)
4. **Configure webhooks** (optional) for order status updates

### Making Requests to Coinbase

The backend must transform the mobile app request and add required fields before forwarding to Coinbase's Onramp API.

**Coinbase Endpoint:** `POST https://api.developer.coinbase.com/onramp/v1/buy/order`

**Authentication:**

```
Authorization: Bearer <COINBASE_API_KEY>
```

**Required Coinbase Request Body:**

The backend must send these fields to Coinbase (in addition to what the mobile app provides):

```typescript
{
  destination_wallets: [{
    address: string;           // From mobile app
    blockchains: string[];     // [destinationNetwork]
    assets: string[];          // [purchaseCurrency]
  }],
  quote_id: null,              // null for direct orders
  payment_method: string,      // From mobile app
  payment_amount: {
    amount: string,            // From mobile app
    currency: string           // From mobile app
  },
  purchase_amount: {
    amount: string,            // From mobile app
    currency: string           // From mobile app
  },
  // Additional required fields extracted from authenticated user:
  partner_user_ref: string,    // Dynamic user ID (prefix with "sandbox-" in sandbox mode)
  email: string,               // From Dynamic JWT
  phone_number: string,        // From verified credentials
  phone_number_verified_at: string  // ISO timestamp
}
```

## Example Implementations

This example uses Next.js App Router with TypeScript. Create `app/coinbase/onramp/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

// Coinbase API configuration
const COINBASE_API_KEY = process.env.COINBASE_API_KEY;
const COINBASE_API_URL = "https://api.developer.coinbase.com/onramp/v1";

// Helper function to verify Dynamic JWT
async function verifyDynamicJWT(token: string, environmentId: string) {
  // TODO: Implement JWT verification with Dynamic Labs
  // See: https://docs.dynamic.xyz/api-reference/authentication/verify-jwt

  // Example verification endpoint:
  // const response = await fetch('https://app.dynamic.xyz/api/v0/environments/${environmentId}/verify', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });

  // For now, return mock user (replace with actual verification)
  return {
    id: "user_123",
    email: "user@example.com",
    verifiedCredentials: [
      {
        format: "phoneNumber",
        value: "+12345678901",
        verifiedAt: new Date().toISOString(),
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    // Extract and verify authentication
    const authHeader = request.headers.get("authorization");
    const environmentId = request.headers.get("x-dynamic-environment-id");

    if (!authHeader || !environmentId) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const user = await verifyDynamicJWT(token, environmentId);

    // Parse request body
    const body = await request.json();

    // Extract phone number from verified credentials
    const phoneCredential = user.verifiedCredentials?.find(
      (cred: any) => cred.format === "phoneNumber"
    );

    if (!phoneCredential) {
      return NextResponse.json(
        { error: { message: "Phone verification required" } },
        { status: 400 }
      );
    }

    // Build Coinbase API request
    const coinbaseRequest = {
      destination_wallets: [
        {
          address: body.destinationAddress,
          blockchains: [body.destinationNetwork],
          assets: [body.purchaseCurrency],
        },
      ],
      quote_id: null,
      payment_method: body.paymentMethod,
      payment_amount: {
        amount: body.paymentAmount,
        currency: body.paymentCurrency,
      },
      purchase_amount: {
        amount: body.purchaseAmount,
        currency: body.purchaseCurrency,
      },
      // Add required user fields
      partner_user_ref: body.isSandbox ? `sandbox-${user.id}` : user.id,
      email: user.email,
      phone_number: phoneCredential.value,
      phone_number_verified_at: phoneCredential.verifiedAt,
    };

    // Call Coinbase API
    const response = await fetch(`${COINBASE_API_URL}/buy/order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COINBASE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(coinbaseRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Coinbase API error");
    }

    const orderResponse = await response.json();

    // Return formatted response
    return NextResponse.json({
      success: true,
      data: {
        id: orderResponse.id,
        paymentUrl: orderResponse.payment_url,
        status: orderResponse.status,
        createdAt: orderResponse.created_at,
        orderDetails: orderResponse,
      },
    });
  } catch (error) {
    console.error("Error creating Coinbase order:", error);

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Failed to create order",
        },
      },
      { status: 500 }
    );
  }
}
```

### Option 2: Express.js

For a traditional Express.js server:

```typescript
import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*", // Configure appropriately for production
    methods: ["POST", "GET", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Dynamic-Environment-Id",
    ],
  })
);

const COINBASE_API_KEY = process.env.COINBASE_API_KEY;
const COINBASE_API_URL = "https://api.developer.coinbase.com/onramp/v1";

// Middleware to verify Dynamic JWT and extract user info
async function verifyDynamicAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const environmentId = req.headers["x-dynamic-environment-id"];

  if (!token || !environmentId) {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }

  // TODO: Verify JWT with Dynamic Labs
  // Attach user info to request object
  req.user = {
    id: "user_123",
    email: "user@example.com",
    phoneNumber: "+12345678901",
    phoneNumberVerifiedAt: new Date().toISOString(),
  };

  next();
}

app.post("/coinbase/onramp", verifyDynamicAuth, async (req: any, res: any) => {
  try {
    const coinbaseRequest = {
      destination_wallets: [
        {
          address: req.body.destinationAddress,
          blockchains: [req.body.destinationNetwork],
          assets: [req.body.purchaseCurrency],
        },
      ],
      quote_id: null,
      payment_method: req.body.paymentMethod,
      payment_amount: {
        amount: req.body.paymentAmount,
        currency: req.body.paymentCurrency,
      },
      purchase_amount: {
        amount: req.body.purchaseAmount,
        currency: req.body.purchaseCurrency,
      },
      partner_user_ref: req.body.isSandbox
        ? `sandbox-${req.user.id}`
        : req.user.id,
      email: req.user.email,
      phone_number: req.user.phoneNumber,
      phone_number_verified_at: req.user.phoneNumberVerifiedAt,
    };

    const response = await fetch(`${COINBASE_API_URL}/buy/order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COINBASE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(coinbaseRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Coinbase API error");
    }

    const orderResponse = await response.json();

    res.json({
      success: true,
      data: {
        id: orderResponse.id,
        paymentUrl: orderResponse.payment_url,
        status: orderResponse.status,
        createdAt: orderResponse.created_at,
        orderDetails: orderResponse,
      },
    });
  } catch (error) {
    console.error("Error creating Coinbase order:", error);
    res.status(500).json({
      error: {
        message:
          error instanceof Error ? error.message : "Failed to create order",
      },
    });
  }
});

app.listen(3000, () => {
  console.log("Backend API running on port 3000");
});
```

## Error Handling

The backend should handle and translate Coinbase API errors appropriately:

### Common Error Scenarios

1. **Invalid API Credentials**: Return 500 with message about configuration
2. **Invalid Wallet Address**: Return 400 with validation error
3. **Unsupported Network/Currency**: Return 400 with supported options
4. **Rate Limiting**: Return 429 with retry-after information
5. **Coinbase Service Unavailable**: Return 503 with retry guidance

### Error Response Format

Always return errors in a consistent format:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE_IDENTIFIER",
    "details": {
      "field": "Additional context if applicable"
    }
  }
}
```

## Security Best Practices

1. **Never expose Coinbase API credentials** to the mobile app
2. **Always verify Dynamic JWT tokens** before processing requests
3. **Validate all input parameters** (amounts, addresses, networks)
4. **Implement rate limiting** to prevent abuse
5. **Log all transactions** for audit purposes
6. **Use HTTPS only** in production
7. **Configure CORS** appropriately for mobile apps
8. **Validate webhook signatures** if using Coinbase webhooks

## Important Implementation Notes

### Phone Verification

The mobile app requires phone verification before allowing deposits. Your backend must:

1. Extract the phone number from the user's verified credentials
2. Validate that the phone number was verified
3. Pass the phone number and verification timestamp to Coinbase

If a user hasn't verified their phone:

- The mobile app will show a phone verification modal
- User must complete SMS OTP verification
- Only then can they proceed with purchases

### User Identification

Use the `partner_user_ref` field to link orders to users:

- In **sandbox mode**: Prefix with `"sandbox-"` (e.g., `"sandbox-user_123"`)
- In **production**: Use the Dynamic user ID directly (e.g., `"user_123"`)

This helps Coinbase track users and enforce transaction limits.

## Environment Variables

Your backend should use environment variables:

```bash
# Coinbase Configuration
COINBASE_API_KEY=your_coinbase_api_key
COINBASE_SANDBOX_MODE=true  # Set to false for production

# Dynamic Labs Configuration
DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
DYNAMIC_PUBLIC_KEY=your_dynamic_public_key  # For JWT verification

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Testing

### Sandbox Mode

Coinbase provides a sandbox environment for testing. Set `isSandbox: true` in requests during development.

### Test Credentials

In sandbox mode, you can use test Apple Pay cards provided by Apple's developer documentation.

### Webhook Testing

Use tools like ngrok to expose your local backend for webhook testing:

```bash
ngrok http 3000
```

## Additional Resources

- [Coinbase Onramp API Documentation](https://docs.cloud.coinbase.com/onramp/docs)
- [Dynamic Labs Authentication](https://docs.dynamic.xyz/api-reference/authentication)
- [Apple Pay Integration Guide](https://developer.apple.com/documentation/passkit/apple_pay)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
