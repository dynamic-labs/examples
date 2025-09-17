"use client";

import { useState, useEffect } from "react";
import { useDynamicContext, useIsLoggedIn } from "@/lib/dynamic";
import { Button } from "../ui/button";

export default function DynamicLogout() {
  const { handleLogOut } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!isLoggedIn || !hasMounted) return null;
  return (
    <Button variant="link" onClick={handleLogOut}>
      Logout
    </Button>
  );
}
