"use client";

import { motion } from "motion/react";

interface TagsFilterProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];
}

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  trending: {
    bg: "bg-[#8b5cf6]/20",
    text: "text-[#8b5cf6]",
    border: "border-[#8b5cf6]/30",
  },
  hot: {
    bg: "bg-[#ef4444]/20",
    text: "text-[#ef4444]",
    border: "border-[#ef4444]/30",
  },
  new: {
    bg: "bg-[#14b8a6]/20",
    text: "text-[#14b8a6]",
    border: "border-[#14b8a6]/30",
  },
  "ending soon": {
    bg: "bg-[#f59e0b]/20",
    text: "text-[#f59e0b]",
    border: "border-[#f59e0b]/30",
  },
  "high stakes": {
    bg: "bg-[#ec4899]/20",
    text: "text-[#ec4899]",
    border: "border-[#ec4899]/30",
  },
  "close call": {
    bg: "bg-[#06b6d4]/20",
    text: "text-[#06b6d4]",
    border: "border-[#06b6d4]/30",
  },
};

export function TagsFilter({
  selectedTags,
  onTagToggle,
  availableTags,
}: TagsFilterProps) {
  if (availableTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-[8px] items-center pt-[16px]">
      {availableTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        const colors = TAG_COLORS[tag] || {
          bg: "bg-[rgba(221,226,246,0.1)]",
          text: "text-[rgba(221,226,246,0.6)]",
          border: "border-[rgba(221,226,246,0.2)]",
        };

        return (
          <motion.button
            key={tag}
            onClick={() => onTagToggle(tag)}
            whileTap={{ scale: 0.95 }}
            className={`px-[12px] py-[6px] rounded-[16px] text-[13px] font-['Clash_Display',sans-serif] font-medium border cursor-pointer transition-all duration-150 ${
              isSelected
                ? `${colors.bg} ${colors.text} ${colors.border}`
                : "bg-transparent text-[rgba(221,226,246,0.4)] border-[rgba(221,226,246,0.1)] hover:border-[rgba(221,226,246,0.3)]"
            }`}
          >
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </motion.button>
        );
      })}
    </div>
  );
}

