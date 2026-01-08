"use client";

interface SortFilterProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "volume", label: "Volume" },
  { value: "traders", label: "Traders" },
  { value: "price-diff", label: "Price Difference" },
] as const;

export function SortFilter({ sortBy, onSortChange }: SortFilterProps) {
  return (
    <div className="pt-[16px] flex items-center gap-3">
      <span className="font-['SF_Pro_Rounded:Semibold',sans-serif] text-[15.986px] text-[rgba(221,226,246,0.5)]">
        Sort by:
      </span>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="bg-[#0e1219] border border-[#262a34] rounded-[27px] px-[12px] py-[6px] font-['SF_Pro_Rounded:Semibold',sans-serif] text-[15.986px] text-[#dde2f6] focus:outline-none focus:border-[rgba(221,226,246,0.4)] transition-colors duration-150"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
