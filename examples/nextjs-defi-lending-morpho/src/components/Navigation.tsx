"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { ModeToggle } from "@/components/mode-toggle";
import { HamburgerMenu } from "./HamburgerMenu";
import DynamicButton from "./dynamic/DynamicButton";
import DynamicLogo from "./dynamic/Logo";
import { Button } from "./ui/button";

export default function Navigation() {
  const currentPath = usePathname();

  const isActiveOrChild = (path: string) =>
    currentPath === path || currentPath.startsWith(`${path}/`);

  const navItems = (
    <>
      <Button variant="link" asChild>
        <Link
          href="/borrow"
          className={
            isActiveOrChild("/borrow")
              ? "text-primary underline"
              : "text-muted-foreground hover:text-primary hover:bg-accent"
          }
        >
          Borrow
        </Link>
      </Button>
      <Button variant="link" asChild>
        <Link
          href="/earn"
          className={
            isActiveOrChild("/earn")
              ? "text-primary underline"
              : "text-muted-foreground hover:text-primary hover:bg-accent"
          }
        >
          Earn
        </Link>
      </Button>
    </>
  );

  return (
    <div
      className={
        "absolute top-0 flex items-center justify-between w-full py-2 sticky bg-background/80 backdrop-blur-md border-b border-border z-50"
      }
    >
      <div className="pl-4 h-[40px] flex items-center">
        <Link href="/">
          <DynamicLogo />
        </Link>
      </div>
      <div className="hidden md:flex gap-2 pr-4 items-center">
        {navItems}
        <DynamicWidget />
        <ModeToggle />
      </div>
      <div className="md:hidden pr-4">
        <HamburgerMenu>
          {navItems}
          <DynamicButton />
        </HamburgerMenu>
      </div>
    </div>
  );
}
