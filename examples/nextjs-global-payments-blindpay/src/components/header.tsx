"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import DynamicLogo from "./dynamic/logo";
import DynamicButton from "./dynamic/dynamic-button";

export function Header() {
  const currentPath = usePathname();

  const isActiveOrChild = (path: string) =>
    currentPath === path || currentPath.startsWith(`${path}/`);

  const linkClassName = (path: string) =>
    isActiveOrChild(path)
      ? "text-primary underline"
      : "text-muted-foreground hover:text-primary hover:bg-accent";

  const navItems = (
    <>
      <Button variant="link" asChild>
        <Link href="/" className={linkClassName("/")}>
          Home
        </Link>
      </Button>
      <Button variant="link" asChild>
        <Link href="/conversions" className={linkClassName("/conversions")}>
          Conversions
        </Link>
      </Button>
      <Button variant="link" asChild>
        <Link
          href="/payment-methods"
          className={linkClassName("/payment-methods")}
        >
          Payment Methods
        </Link>
      </Button>
      <Button variant="link" asChild>
        <Link href="/transactions" className={linkClassName("/transactions")}>
          History
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
      <div className="hidden md:flex gap-2 pr-4">
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
