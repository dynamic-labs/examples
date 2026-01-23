"use client";

import { ChevronDown } from "lucide-react";

export type SortOption = "volume" | "ending-soon" | "newest";

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "volume", label: "Volume" },
  { value: "ending-soon", label: "Ending Soon" },
  { value: "newest", label: "Newest" },
];

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="appearance-none bg-[#1a1b23] border border-[#262a34] rounded-[8px] px-[12px] py-[8px] pr-[32px] font-['Clash_Display',sans-serif] text-[14px] text-[rgba(221,226,246,0.7)] font-medium cursor-pointer hover:border-[#8b5cf6]/40 transition-colors outline-none"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            Sort: {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-[10px] top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(221,226,246,0.5)] pointer-events-none" />
    </div>
  );
}
