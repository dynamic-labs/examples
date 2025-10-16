import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import WatermarkSvg from "@morpho-org/uikit/assets/powered-by-morpho.svg?react";
import { Button } from "@morpho-org/uikit/components/shadcn/button";
import { cn } from "@morpho-org/uikit/lib/utils";
import { X } from "lucide-react";
import { Link } from "react-router";

import { WORDMARK } from "@/lib/constants";

enum SubPage {
  Earn = "earn",
  Borrow = "borrow",
}

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubPage: SubPage;
}

export function HamburgerMenu({ isOpen, onClose, selectedSubPage }: HamburgerMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="bg-background z-52 fixed inset-0 flex flex-col">
      {/* Header Section */}
      <div className="bg-primary flex h-16 items-center justify-between px-5 py-3">
        <div className="text-primary-foreground flex items-center gap-4">
          {WORDMARK.length > 0 ? (
            <>
              <img className="max-h-[24px]" src={WORDMARK} />
              <WatermarkSvg height={24} className="text-primary-foreground/50 w-[170px] min-w-[170px]" />
            </>
          ) : (
            <div className="flex items-center gap-1">
              <WatermarkSvg height={24} className="text-primary-foreground/50 w-[170px] min-w-[170px]" />
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-primary-foreground hover:bg-primary-foreground/10 rounded p-2">
          <X size={24} />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-1 flex-col justify-center px-5">
        <div className="flex flex-col gap-4">
          <Link to={SubPage.Earn} relative="path" onClick={onClose}>
            <Button
              variant={selectedSubPage === SubPage.Earn ? "tertiary" : "outline"}
              size="lg"
              className={cn(
                "w-full rounded-full px-6 py-8 text-lg font-light",
                selectedSubPage === SubPage.Earn && "bg-primary text-primary-foreground",
              )}
            >
              Earn
            </Button>
          </Link>
          <Link to={SubPage.Borrow} relative="path" onClick={onClose}>
            <Button
              variant={selectedSubPage === SubPage.Borrow ? "tertiary" : "outline"}
              size="lg"
              className={cn(
                "w-full rounded-full px-6 py-8 text-lg font-light",
                selectedSubPage === SubPage.Borrow && "bg-primary text-primary-foreground",
              )}
            >
              Borrow
            </Button>
          </Link>
        </div>
      </div>

      {/* Dynamic Widget at bottom */}
      <div className="bg-card p-5">
        <div className="flex w-full justify-center">
          <DynamicWidget />
        </div>
      </div>
    </div>
  );
}
