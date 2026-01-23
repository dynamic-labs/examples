"use client";

import { motion } from "motion/react";
import ClockIcon from "./ClockIcon";
import { ImageWithFallback } from "./ImageWithFallback";

interface MarketCardProps {
  question: string;
  timeRemaining: string;
  yesPrice: string;
  noPrice: string;
  imageUrl?: string;
  yesTraders?: number;
  noTraders?: number;
}

export function MarketCard({
  question,
  timeRemaining,
  yesPrice,
  noPrice,
  imageUrl,
  yesTraders,
  noTraders,
}: MarketCardProps) {
  return (
    <motion.div
      layout
      className="bg-[#12131a] rounded-[22.837px] w-full relative"
    >
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <div className="bg-[#1a1b23] relative rounded-[22.837px] shrink-0 w-full">
          <div
            aria-hidden="true"
            className="absolute border-[#262a34] border-[0.571px] border-solid inset-0 pointer-events-none rounded-[22.837px] shadow-[0px_1.142px_2.284px_0px_rgba(0,0,0,0.02)]"
          />
          <div className="size-full">
            <div className="box-border content-stretch flex flex-col gap-[13.702px] items-start p-[15.986px] relative w-full">
              <div className="content-stretch flex gap-[9.135px] items-start relative shrink-0 w-full">
                <div className="basis-0 content-stretch flex flex-col gap-[9.135px] grow items-start min-h-px min-w-px relative shrink-0">
                  <div className="bg-linear-to-br from-[#8b5cf6]/20 to-[#06b6d4]/20 overflow-clip relative rounded-[7px] shrink-0 size-[45.675px]">
                    {imageUrl ? (
                      <ImageWithFallback
                        src={imageUrl}
                        alt="Market thumbnail"
                        className="absolute left-0 top-0 size-[45.675px] object-cover"
                        sizes="50px"
                      />
                    ) : (
                      <div className="absolute bg-linear-to-br from-[#8b5cf6]/30 to-[#06b6d4]/30 left-0 size-[45.675px] top-0 flex items-center justify-center">
                        <span className="text-lg">📊</span>
                      </div>
                    )}
                  </div>
                  <p className="font-['Clash_Display',sans-serif] leading-[22.837px] not-italic relative shrink-0 text-white text-[18.27px] tracking-[0.1827px] font-semibold line-clamp-2 h-[45.674px]">
                    {question}
                  </p>
                </div>

                <div className="content-stretch flex gap-[9.135px] h-[27.405px] items-center justify-end relative shrink-0 w-[80px]">
                  <div className="content-stretch flex gap-[4.567px] items-center overflow-clip relative shrink-0">
                    <ClockIcon />
                    <p className="font-['Clash_Display',sans-serif] leading-[18.27px] not-italic relative shrink-0 text-[13.702px] text-[rgba(221,226,246,0.5)] text-nowrap tracking-[0.137px] whitespace-pre font-medium">
                      {timeRemaining}
                    </p>
                  </div>
                </div>
              </div>

              {yesTraders !== undefined && noTraders !== undefined && (
                <div className="flex items-center gap-[12px] w-full">
                  <div className="flex items-center gap-[8px]">
                    <div className="bg-[#14b8a6]/10 px-[8px] py-[4px] rounded-[20px]">
                      <span className="font-['Clash_Display',sans-serif] text-[#14b8a6] text-[12px] font-semibold">
                        Yes {yesPrice}%
                      </span>
                    </div>
                    <div className="bg-[#ef4444]/10 px-[8px] py-[4px] rounded-[20px]">
                      <span className="font-['Clash_Display',sans-serif] text-[#ef4444] text-[12px] font-semibold">
                        No {noPrice}%
                      </span>
                    </div>
                  </div>
                  <span className="font-['Clash_Display',sans-serif] text-[#7b7f8d] text-[11px] font-medium ml-auto">
                    ${((yesTraders + noTraders) * 234).toLocaleString()} Vol.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative shrink-0 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="box-border content-stretch flex flex-col gap-[11px] items-start p-[13.702px] relative w-full">
              <div className="content-stretch flex gap-[4.567px] h-[41.107px] items-start relative shrink-0 w-full">
                <div className="basis-0 grow h-full min-h-px min-w-px relative rounded-[9.135px] shrink-0 bg-[#14b8a6]/10">
                  <div className="flex flex-row items-center justify-center size-full">
                    <div className="box-border content-stretch flex gap-[22.837px] items-center justify-center px-[22.837px] py-[11.419px] relative size-full">
                      <div className="flex flex-col font-['Clash_Display',sans-serif] justify-center leading-0 not-italic relative shrink-0 text-[15.986px] text-nowrap text-right font-semibold text-[#14b8a6]">
                        <p className="leading-[28.547px] whitespace-pre">
                          Yes {yesPrice}¢
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="basis-0 grow h-full min-h-px min-w-px relative rounded-[9.135px] shrink-0 bg-[#ef4444]/10">
                  <div className="flex flex-row items-center justify-center size-full">
                    <div className="box-border content-stretch flex gap-[22.837px] items-center justify-center px-[22.837px] py-[11.419px] relative size-full">
                      <div className="flex flex-col font-['Clash_Display',sans-serif] justify-center leading-0 not-italic relative shrink-0 text-[15.986px] text-nowrap text-right font-semibold text-[#ef4444]">
                        <p className="leading-[28.547px] whitespace-pre">
                          No {noPrice}¢
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute border-[#262a34] border-[0.571px] border-solid inset-0 pointer-events-none rounded-[22.837px]"
      />
    </motion.div>
  );
}
