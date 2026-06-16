"use client";

/**
 * DynamicWidget
 *
 * Auth widget used on the Methods page to show the user's auth state.
 * Renders the DynamicAuthButton which handles login/logout with the new SDK.
 */

import DynamicAuthButton from "./dynamic-auth-button";

export default function DynamicWidget() {
  return <DynamicAuthButton />;
}
