import Link from "next/link";

import DynamicLogo from "./dynamic/logo";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { HamburgerMenu } from "./hamburger-menu";

export default function Header() {
  const navItems = (
    <Button variant="link" asChild>
      <Link href="/methods">Methods</Link>
    </Button>
  );

  return (
    <div
      className={"absolute top-0 flex items-center justify-between w-full py-2"}
    >
      <div className="pl-4 h-[40px] flex items-center">
        <Link href="/">
          <DynamicLogo />
        </Link>
      </div>
      <div className="hidden md:flex gap-2 pr-4">
        {navItems}
        <ModeToggle />
      </div>
      <div className="md:hidden pr-4">
        <HamburgerMenu>{navItems}</HamburgerMenu>
      </div>
    </div>
  );
}