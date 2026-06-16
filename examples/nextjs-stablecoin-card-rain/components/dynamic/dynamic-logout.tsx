"use client";

import { useState, useEffect } from "react";
import { useUser } from "@dynamic-labs-sdk/react-hooks";
import { logout } from "@dynamic-labs-sdk/client";
import { dynamicClient } from "@/lib/dynamic";
import { Button } from "../ui/button";

export default function DynamicLogout() {
  const user = useUser();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!user || !hasMounted) return null;
  return (
    <Button variant="link" onClick={() => logout(dynamicClient)}>
      Logout
    </Button>
  );
}
