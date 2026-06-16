"use client";

import { useUser } from "@dynamic-labs-sdk/react-hooks";
import { logout } from "@dynamic-labs-sdk/client";
import { Button } from "@/components/ui/button";
import { dynamicClient } from "@/lib/dynamic";

/**
 * Logout button for the navigation header
 *
 * A client component that handles user logout via Dynamic's SDK.
 * Only renders when a user is logged in. Extracted to its own component
 * to keep the Header component as a server component.
 */
export default function LogoutButton() {
  const user = useUser();

  if (!user) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => logout(dynamicClient)}
      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
    >
      Log Out
    </Button>
  );
}
