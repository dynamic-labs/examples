"use client";

import {
  useDynamicContext,
  useIsLoggedIn,
} from "@dynamic-labs/sdk-react-core";
import { ChevronDown, Loader2, PieChart, Search, X, Wallet } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useKalshiTrading } from "@/lib/hooks/useKalshiTrading";
import { PortfolioModal } from "./positions/PortfolioModal";
import Logo from "./LogoIcon";

interface HeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

function AuthButton() {
  const isLoggedIn = useIsLoggedIn();

  const {
    setShowAuthFlow,
    setShowDynamicUserProfile,
    sdkHasLoaded,
    handleLogOut,
  } = useDynamicContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    await handleLogOut();
    setIsDropdownOpen(false);
  };

  const handleProfileSettings = () => {
    setShowDynamicUserProfile(true);
    setIsDropdownOpen(false);
  };

  if (!sdkHasLoaded) {
    return (
      <div className="relative">
        <button
          type="button"
          disabled
          className="box-border flex gap-[6px] items-center justify-center pl-[5px] pr-[10px] py-[5px] relative rounded-[59.13px] shrink-0 bg-transparent cursor-not-allowed"
        >
          <div className="w-[31px] h-[31px] rounded-full flex items-center justify-center shrink-0">
            <Loader2 className="w-[26px] h-[26px] text-[#8b5cf6] animate-spin" />
          </div>
        </button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => setShowAuthFlow(true)}
        className="bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] box-border content-stretch flex gap-[22.837px] h-[41.107px] items-center justify-center px-[22.837px] py-[11.419px] relative rounded-[9.135px] shrink-0 w-[128.651px] cursor-pointer hover:opacity-90 transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-[0.90]"
      >
        <div className="flex flex-col font-['Clash_Display',sans-serif] justify-center leading-0 not-italic relative shrink-0 text-white text-[15.986px] text-nowrap text-right font-semibold">
          <p className="leading-[28.547px] whitespace-pre">Login</p>
        </div>
      </button>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`box-border flex gap-[6px] items-center justify-center pl-[5px] pr-[10px] py-[5px] relative rounded-[59.13px] shrink-0 cursor-pointer transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-[0.90] ${
          isDropdownOpen
            ? "bg-[rgba(139,92,246,0.1)]"
            : "bg-transparent hover:bg-[rgba(139,92,246,0.1)]"
        }`}
      >
        <div className="w-[31px] h-[31px] rounded-full bg-gradient-to-br from-[#8b5cf6] via-[#06b6d4] to-[#14b8a6] shrink-0" />
        <ChevronDown
          className={`w-[20px] h-[18px] text-[#8b5cf6] shrink-0 transition-transform duration-150 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 bg-[#1a1b23] rounded-[12px] min-w-[180px] z-50 overflow-hidden p-[4px] border border-[#262a34]">
          <button
            type="button"
            onClick={handleProfileSettings}
            className="w-full px-[16px] py-[12px] text-left text-[#8b5cf6] font-['Clash_Display',sans-serif] font-semibold text-[11.99px] leading-[100%] tracking-[0%] hover:bg-[#252630] rounded-[8px] transition-colors duration-150 cursor-pointer flex items-center"
          >
            Profile Settings
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full pl-[16px] pr-[8px] py-[8px] text-left text-[#8b5cf6] font-['Clash_Display',sans-serif] font-semibold text-[11.99px] leading-[100%] tracking-[0%] bg-[#252630] rounded-[8px] hover:bg-[#2d2e3a] transition-colors duration-150 cursor-pointer mt-[4px] flex items-center"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function PortfolioButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="bg-[#1a1b23] box-border flex h-[41px] items-center justify-center gap-[6px] px-[12px] py-[8px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#252630] transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-[0.90] border border-[#262a34]"
      >
        <PieChart
          className="w-[16px] h-[16px] text-[#8b5cf6]"
          strokeWidth={2}
        />
        <span className="font-['Clash_Display',sans-serif] text-[16px] text-[#8b5cf6] leading-[100%] hidden sm:block font-medium">
          Portfolio
        </span>
      </button>
      <PortfolioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

function BalanceButton() {
  const { getSolBalance } = useKalshiTrading();
  const [balance, setBalance] = useState<number | null>(null);
  const isLoggedIn = useIsLoggedIn();

  const fetchBalance = useCallback(async () => {
    if (!isLoggedIn) return;
    const bal = await getSolBalance();
    setBalance(bal);
  }, [isLoggedIn, getSolBalance]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  const displayText =
    balance !== null && balance > 0 ? `${balance.toFixed(3)} SOL` : "Deposit";

  return (
    <button
      type="button"
      className="bg-[#1a1b23] box-border flex h-[41px] items-center justify-center gap-[6px] pl-[12px] pr-[12px] py-[8px] relative rounded-[8px] shrink-0 w-[125px] cursor-pointer hover:bg-[#252630] transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-[0.90] border border-[#262a34]"
    >
      <Wallet className="w-[16px] h-[16px] text-[#14b8a6]" />
      <div className="flex flex-col font-['Clash_Display',sans-serif] justify-center leading-[100%] not-italic relative shrink-0 text-[#14b8a6] text-[16px] text-nowrap tracking-[0%] text-right font-medium">
        <p className="leading-[100%] whitespace-pre">{displayText}</p>
      </div>
    </button>
  );
}

function SearchInput({ searchValue, onSearchChange }: HeaderProps) {
  const handleClearSearch = () => onSearchChange("");

  return (
    <div className="bg-[#1a1b23] box-border hidden md:flex gap-[8px] h-[41px] items-center pl-[9px] pr-[14.84px] py-[11.419px] rounded-[9.135px] flex-1 max-w-[423px] relative border border-[#262a34]">
      <Search
        className="w-[18px] h-[18px] text-[#474d68] shrink-0"
        strokeWidth="1.5"
      />
      <input
        type="text"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search for markets"
        className="bg-transparent flex-1 font-['Clash_Display',sans-serif] outline-none text-[15.986px] text-[#dde2f6] placeholder:text-[#474d68]"
      />
      {searchValue && (
        <button
          type="button"
          onClick={handleClearSearch}
          className="w-[18px] h-[18px] text-[#474d68] hover:text-[#dde2f6] shrink-0 transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X className="w-full h-full" />
        </button>
      )}
    </div>
  );
}

function HeaderContent({ searchValue, onSearchChange }: HeaderProps) {
  const isLoggedIn = useIsLoggedIn();

  return (
    <div className="content-stretch flex items-center gap-[16px] relative shrink-0 w-full">
      <Logo />
      <SearchInput searchValue={searchValue} onSearchChange={onSearchChange} />
      <div className="flex items-center gap-[8px] ml-auto">
        {isLoggedIn && (
          <>
            <PortfolioButton />
            <BalanceButton />
          </>
        )}
        <AuthButton />
      </div>
    </div>
  );
}

export function Header({ searchValue, onSearchChange }: HeaderProps) {
  return (
    <div className="content-stretch flex flex-col gap-[19px] items-start pt-[21px] w-full">
      <HeaderContent
        searchValue={searchValue}
        onSearchChange={onSearchChange}
      />
      <div className="flex h-px items-center justify-center relative shrink-0 w-full">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#8b5cf6]/20 to-transparent" />
      </div>
    </div>
  );
}

