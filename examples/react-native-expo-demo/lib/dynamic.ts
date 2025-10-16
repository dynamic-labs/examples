import { createClient } from "@dynamic-labs/client";
import { ReactNativeExtension } from "@dynamic-labs/react-native-extension";
import { ViemExtension } from "@dynamic-labs/viem-extension";
import { ZeroDevExtension } from "@dynamic-labs/zerodev-extension";

/**
 * Dynamic Labs Environment ID
 * Retrieved from the EXPO_PUBLIC_ENVIRONMENT_ID environment variable
 * This identifies your Dynamic Labs project/environment
 */
export const environmentId = process.env.EXPO_PUBLIC_ENVIRONMENT_ID as string;
if (!environmentId) throw new Error("EXPO_PUBLIC_ENVIRONMENT_ID is required");

/**
 * Dynamic Labs Client Instance
 *
 * Configured with three essential extensions:
 *
 * 1. ReactNativeExtension: Provides React Native compatibility including:
 *    - WebView integration for authentication flows
 *    - Secure storage for tokens and credentials
 *    - Native platform support (iOS/Android)
 *
 * 2. ViemExtension: Enables Ethereum interaction via Viem library:
 *    - Transaction signing and sending
 *    - Smart contract interaction
 *    - Multi-chain support
 *    - Type-safe blockchain operations
 *
 * 3. ZeroDevExtension: Adds account abstraction capabilities:
 *    - Gasless transactions (sponsored gas fees)
 *    - Batch transactions for efficiency
 *    - Session keys for improved UX
 *    - Smart contract wallet features
 *
 * @example
 * // Use the client for authentication
 * await dynamicClient.auth.email.sendOTP(email);
 *
 * @example
 * // Access wallet functionality
 * const wallet = dynamicClient.wallets.primary;
 * const balance = await dynamicClient.wallets.getBalance({ wallet });
 */
export const dynamicClient = createClient({
  environmentId,
  appLogoUrl: "https://demo.dynamic.xyz/favicon-32x32.png",
  appName: "Dynamic Demo",
})
  .extend(ReactNativeExtension())
  .extend(ViemExtension())
  .extend(ZeroDevExtension());
