"use client";

/**
 * Email OTP Authentication
 *
 * Passwordless email authentication using one-time passwords.
 * These functions wait for client initialization before executing
 * to ensure auth state is ready.
 *
 * @see https://www.dynamic.xyz/docs/javascript/authentication-methods/email
 */

import {
  sendEmailOTP as sdkSendEmailOTP,
  verifyOTP as sdkVerifyOTP,
  waitForClientInitialized as sdkWaitForClientInitialized,
  type OTPVerification,
  type VerifyResponse,
} from "@dynamic-labs-sdk/client";
import { getClient } from "./client";

/**
 * Send OTP code to user's email.
 * Waits for client initialization before sending.
 */
export async function sendEmailOTP(params: {
  email: string;
}): Promise<OTPVerification> {
  const client = getClient();
  if (!client) throw new Error("Dynamic client not initialized");

  // Ensure client is fully initialized before auth operations
  await sdkWaitForClientInitialized(client);
  return sdkSendEmailOTP(params);
}

/**
 * Verify the OTP code entered by user.
 * Waits for client initialization before verifying.
 */
export async function verifyOTP(params: {
  otpVerification: OTPVerification;
  verificationToken: string;
}): Promise<VerifyResponse> {
  const client = getClient();
  if (!client) throw new Error("Dynamic client not initialized");

  await sdkWaitForClientInitialized(client);
  return sdkVerifyOTP(params);
}
