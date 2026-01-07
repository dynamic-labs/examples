"use client";

import { ChevronDown } from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface SortFilterProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const sortOptions = [
  { value: "volume", label: "Volume" },
  { value: "newest", label: "Ending Soon" },
  { value: "oldest", label: "Ending Latest" },
  { value: "traders", label: "Most Active" },
  { value: "price-diff", label: "Closest Odds" },
];

export function SortFilter({ sortBy, onSortChange }: SortFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label || "Sort";

  return (
    <div className="flex items-center justify-between pt-[16px]">
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-[6px] px-[12px] py-[8px] rounded-[8px] bg-[#1a1b23] border border-[#262a34] hover:border-[#8b5cf6]/40 transition-all duration-150 cursor-pointer"
        >
          <span className="font-['Clash_Display',sans-serif] text-[14px] text-[rgba(221,226,246,0.7)] font-medium">
            Sort by: {currentLabel}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[rgba(221,226,246,0.5)] transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 bg-[#1a1b23] rounded-[8px] border border-[#262a34] overflow-hidden z-50 min-w-[160px]">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-[12px] py-[10px] text-left font-['Clash_Display',sans-serif] text-[13px] transition-colors duration-150 cursor-pointer font-medium ${
                  sortBy === option.value
                    ? "bg-[#8b5cf6]/20 text-[#8b5cf6]"
                    : "text-[rgba(221,226,246,0.6)] hover:bg-[#252630]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

