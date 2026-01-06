"use client";

import {
  useDynamicContext,
  useIsLoggedIn,
  useTokenBalances,
} from "@dynamic-labs/sdk-react-core";
import { ChevronDown, Loader2, PieChart, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getContractAddress } from "@/lib/constants/contracts";
import { DEFAULT_NETWORK_ID } from "@/lib/constants/network";
import { DepositModal } from "./DepositModal";
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

  // Close dropdown when clicking outside
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

  const handleTermsAndConditions = () => setIsDropdownOpen(false);

  const handleProfileSettings = () => {
    setShowDynamicUserProfile(true);
    setIsDropdownOpen(false);
  };

  // Show loading spinner while SDK is initializing
  if (!sdkHasLoaded) {
    return (
      <div className="relative">
        <button
          type="button"
          disabled
          className="box-border flex gap-[6px] items-center justify-center pl-[5px] pr-[10px] py-[5px] relative rounded-[59.13px] shrink-0 bg-transparent cursor-not-allowed"
        >
          {/* Spinner matching avatar size */}
          <div className="w-[31px] h-[31px] rounded-full flex items-center justify-center shrink-0">
            <Loader2 className="w-[26px] h-[26px] text-[#72d0ed] animate-spin" />
          </div>
        </button>
      </div>
    );
  }

  // Show login button when SDK is loaded and user is not authenticated
  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => setShowAuthFlow(true)}
        className="bg-[#72d0ed] box-border content-stretch flex gap-[22.837px] h-[41.107px] items-center justify-center px-[22.837px] py-[11.419px] relative rounded-[9.135px] shrink-0 w-[128.651px] cursor-pointer hover:opacity-80 transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-[0.90]"
      >
        <div
          aria-hidden="true"
          className="absolute border-[1.142px] border-[rgba(22,22,22,0.06)] border-solid inset-0 pointer-events-none rounded-[9.135px]"
        />
        <div className="flex flex-col font-['SF_Pro_Rounded:Semibold',sans-serif] justify-center leading-0 not-italic relative shrink-0 text-[#0e1219] text-[15.986px] text-nowrap text-right">
          <p className="leading-[28.547px] whitespace-pre">Login</p>
        </div>
      </button>
    );
  }

  // Profile button with dropdown menu
  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`box-border flex gap-[6px] items-center justify-center pl-[5px] pr-[10px] py-[5px] relative rounded-[59.13px] shrink-0 cursor-pointer transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-[0.90] ${
          isDropdownOpen
            ? "bg-[rgba(114,208,237,0.1)]"
            : "bg-transparent hover:bg-[rgba(114,208,237,0.1)]"
        }`}
      >
        {/* Gradient Circle Avatar */}
        <div className="w-[31px] h-[31px] rounded-full bg-linear-to-br from-[#2768FC] via-[#5483F0] to-[#9D4EDD] shrink-0" />
        <ChevronDown
          className={`w-[20px] h-[18px] text-[#72D0ED] shrink-0 transition-transform duration-150 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 bg-[#18252E] rounded-[12px] min-w-[180px] z-50 overflow-hidden p-[4px]">
          <button
            type="button"
            onClick={handleTermsAndConditions}
            className="w-full px-[16px] py-[12px] text-left text-[#72D0ED] font-['SF_Pro_Rounded:Semibold',sans-serif] font-semibold text-[11.99px] leading-[100%] tracking-[0%] hover:bg-[#20323E] rounded-[8px] transition-colors duration-150 cursor-pointer flex items-center"
          >
            Terms & Conditions
          </button>
          <button
            type="button"
            onClick={handleProfileSettings}
            className="w-full px-[16px] py-[12px] text-left text-[#72D0ED] font-['SF_Pro_Rounded:Semibold',sans-serif] font-semibold text-[11.99px] leading-[100%] tracking-[0%] hover:bg-[#20323E] rounded-[8px] transition-colors duration-150 cursor-pointer flex items-center"
          >
            Profile Settings
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full pl-[16px] pr-[8px] py-[8px] text-left text-[#72D0ED] font-['SF_Pro_Rounded:Semibold',sans-serif] font-semibold text-[11.99px] leading-[100%] tracking-[0%] bg-[#20323E] rounded-[8px] hover:bg-[#2a3d4a] transition-colors duration-150 cursor-pointer mt-[4px] flex items-center"
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
        className="bg-[#18252E] box-border flex h-[41px] items-center justify-center gap-[6px] px-[12px] py-[8px] relative rounded-[8px] shrink-0 cursor-pointer hover:opacity-80 transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-[0.90]"
      >
        <PieChart
          className="w-[16px] h-[16px] text-[#72D0ED]"
          strokeWidth={2}
        />
        <span className="font-['SF_Pro_Rounded:Semibold',sans-serif] text-[16px] text-[#72D0ED] leading-[100%] hidden sm:block">
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

function DepositButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { tokenBalances, isLoading, fetchAccountBalances } = useTokenBalances();

  // Listen for token mint events to refresh balance
  useEffect(() => {
    const handleTokenMinted = () => {
      // Refresh token balances after a short delay to allow blockchain to update
      setTimeout(() => {
        fetchAccountBalances?.(true);
      }, 2000);
    };

    window.addEventListener("tokenMinted", handleTokenMinted);
    return () => window.removeEventListener("tokenMinted", handleTokenMinted);
  }, [fetchAccountBalances]);

  // Find the USD token by address (Polygon mainnet network ID: 137)
  const usdTokenAddress = getContractAddress(DEFAULT_NETWORK_ID, "USD");
  const usdToken = tokenBalances?.find(
    (token) =>
      usdTokenAddress &&
      token.address?.toLowerCase() === usdTokenAddress.toLowerCase() &&
      Number(token.networkId) === DEFAULT_NETWORK_ID
  );

  // Dynamic's useTokenBalances returns balance already formatted (divided by decimals)
  // The balance is a number representing the token amount (e.g., 10 = 10 tokens)
  const balance = usdToken?.balance
    ? typeof usdToken.balance === "number"
      ? usdToken.balance
      : parseFloat(String(usdToken.balance))
    : 0;

  // Format balance to show up to 2 decimal places, removing trailing zeros
  const formattedBalance =
    balance > 0 ? balance.toFixed(2).replace(/\.?0+$/, "") : 0;
  const displayText =
    !isLoading && balance > 0 ? `$${formattedBalance}` : "Deposit";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="bg-[#18252E] box-border flex h-[41px] items-center justify-center pl-[7.84px] pr-[7.84px] py-[8px] relative rounded-[8px] shrink-0 w-[125px] cursor-pointer hover:opacity-80 transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-[0.90]"
      >
        <div className="flex flex-col font-['SF_Pro_Rounded:Semibold',sans-serif] justify-center leading-[100%] not-italic relative shrink-0 text-[#72D0ED] text-[16px] text-nowrap tracking-[0%] text-right">
          <p className="leading-[100%] whitespace-pre">{displayText}</p>
        </div>
      </button>
      <DepositModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

function SearchInput({ searchValue, onSearchChange }: HeaderProps) {
  const handleClearSearch = () => onSearchChange("");

  return (
    <div className="bg-[#191b25] box-border hidden md:flex gap-[8px] h-[41px] items-center pl-[9px] pr-[14.84px] py-[11.419px] rounded-[9.135px] flex-1 max-w-[423px] relative">
      <div
        aria-hidden="true"
        className="absolute border-[1.142px] border-[rgba(22,22,22,0.06)] border-solid inset-0 pointer-events-none rounded-[9.135px]"
      />
      <Search
        className="w-[18px] h-[18px] text-[#474d68] shrink-0"
        strokeWidth="1.5"
      />
      <input
        type="text"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search for markets"
        className="bg-transparent flex-1 font-['SF_Pro_Rounded:Semibold',sans-serif] outline-none text-[15.986px] text-[#dde2f6] placeholder:text-[#474d68]"
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
            <DepositButton />
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
        <div className="w-full h-px bg-white opacity-5" />
      </div>
    </div>
  );
}
