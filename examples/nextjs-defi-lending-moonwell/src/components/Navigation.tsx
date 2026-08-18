"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import DynamicLogo from "@/components/dynamic/Logo";

const DynamicButton = dynamic(() => import("@/components/dynamic/DynamicButton"), {
  ssr: false,
});

export default function Navigation() {
  const currentPath = usePathname();
  const isActive = currentPath === "/lend" || currentPath.startsWith("/lend/");

  return (
    <header className="sticky top-0 h-16 bg-white z-40 flex items-center px-4 sm:px-6 gap-6 border-b border-line">
      <Link href="/" className="flex items-center">
        <DynamicLogo width={110} height={22} className="text-ink" />
      </Link>

      <nav className="flex items-center gap-5">
        <Link
          href="/lend"
          className={`text-sm transition-colors ${
            isActive ? "font-bold text-ink" : "text-muted hover:text-ink"
          }`}
        >
          Markets
        </Link>
      </nav>

      <div className="ml-auto">
        <DynamicButton />
      </div>
    </header>
  );
}
