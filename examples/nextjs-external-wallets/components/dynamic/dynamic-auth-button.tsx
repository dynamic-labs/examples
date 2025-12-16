"use client";

/**
 * DynamicAuthButton
 *
 * A login/logout button that:
 * - Shows "Login" when not authenticated (opens Dynamic auth flow)
 * - Shows "Logout" when authenticated
 * - Handles hydration by showing a disabled state during SSR
 */

import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export default function DynamicAuthButton() {
  // Dynamic SDK hooks for auth control
  const { setShowAuthFlow, handleLogOut } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();

  // Track client-side mount to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a neutral disabled state during SSR to match server render
  if (!mounted) {
    return (
      <Button variant="outline" disabled>
        Login
      </Button>
    );
  }

  // Show logout button when authenticated
  if (isLoggedIn) {
    return (
      <Button variant="outline" onClick={() => handleLogOut()}>
        Logout
      </Button>
    );
  }

  // Show login button when not authenticated
  return <Button onClick={() => setShowAuthFlow(true)}>Login</Button>;
}
