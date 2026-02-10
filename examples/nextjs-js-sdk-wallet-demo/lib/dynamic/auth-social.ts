"use client";

/**
 * Social Authentication (OAuth)
 *
 * Google, GitHub, and other social provider authentication flows.
 * Handles the redirect-based OAuth flow: initiate -> redirect -> complete.
 *
 * @see https://www.dynamic.xyz/docs/javascript/authentication-methods/social
 */

import {
  authenticateWithSocial as sdkAuthenticateWithSocial,
  detectOAuthRedirect as sdkDetectOAuthRedirect,
  completeSocialAuthentication as sdkCompleteSocialAuthentication,
} from "@dynamic-labs-sdk/client";
import { createAsyncSafeWrapper } from "./client";

/** Initiate social auth flow (redirects to provider) */
export const authenticateWithSocial = createAsyncSafeWrapper(
  sdkAuthenticateWithSocial,
);

/**
 * Detect OAuth redirect from social provider.
 * Safe to call during SSR - just checks URL params.
 */
export const detectOAuthRedirect = sdkDetectOAuthRedirect;

/** Complete social auth after redirect back from provider */
export const completeSocialAuthentication = createAsyncSafeWrapper(
  sdkCompleteSocialAuthentication,
);
