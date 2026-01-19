"use client";

import { TrendingUp, Users, DollarSign } from "lucide-react";
import type { Market } from "@/lib/types/market";

interface MarketStatsProps {
  markets: Market[];
}

export function MarketStats({ markets }: MarketStatsProps) {
  const totalVolume = markets.reduce((acc, m) => acc + m.volume, 0);
  const totalTraders = markets.reduce(
    (acc, m) => acc + m.yesTraders + m.noTraders,
    0
  );
  const activeMarkets = markets.filter((m) => m.status === "open").length;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num}`;
  };

  const formatTraders = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="flex flex-wrap gap-[16px] items-center pt-[20px]">
      {/* Active Markets */}
      <div className="flex items-center gap-[8px] px-[12px] py-[8px] rounded-[8px] bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
        <TrendingUp className="w-4 h-4 text-[#8b5cf6]" />
        <span className="font-['Clash_Display',sans-serif] text-[13px] text-[#8b5cf6] font-semibold">
          {activeMarkets} Active Markets
        </span>
      </div>

      {/* Total Volume */}
      <div className="flex items-center gap-[8px] px-[12px] py-[8px] rounded-[8px] bg-[#14b8a6]/10 border border-[#14b8a6]/20">
        <DollarSign className="w-4 h-4 text-[#14b8a6]" />
        <span className="font-['Clash_Display',sans-serif] text-[13px] text-[#14b8a6] font-semibold">
          {formatNumber(totalVolume)} Volume
        </span>
      </div>

      {/* Total Traders */}
      <div className="flex items-center gap-[8px] px-[12px] py-[8px] rounded-[8px] bg-[#06b6d4]/10 border border-[#06b6d4]/20">
        <Users className="w-4 h-4 text-[#06b6d4]" />
        <span className="font-['Clash_Display',sans-serif] text-[13px] text-[#06b6d4] font-semibold">
          {formatTraders(totalTraders)} Traders
        </span>
      </div>
    </div>
  );
}
