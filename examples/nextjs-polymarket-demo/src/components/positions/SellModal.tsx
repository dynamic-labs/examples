"use client";

import { useState, useCallback, useMemo } from "react";
import { Loader2, Minus, Plus, X } from "lucide-react";
import type { PolymarketPosition } from "@/lib/hooks/useUserPositions";
import { ImageWithFallback } from "../ImageWithFallback";

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  position: PolymarketPosition | null;
  isLoading?: boolean;
}

export function SellModal({
  isOpen,
  onClose,
  onConfirm,
  position,
  isLoading = false,
}: SellModalProps) {
  const [percentage, setPercentage] = useState(100);

  const shareAmount = useMemo(() => {
    if (!position) return 0;
    return (position.size * percentage) / 100;
  }, [position, percentage]);

  const estimatedValue = useMemo(() => {
    if (!position) return 0;
    return shareAmount * position.curPrice;
  }, [position, shareAmount]);

  const handlePercentageChange = useCallback((value: number) => {
    setPercentage(Math.max(1, Math.min(100, value)));
  }, []);

  const handleConfirm = useCallback(() => {
    if (shareAmount > 0) {
      onConfirm(shareAmount);
    }
  }, [shareAmount, onConfirm]);

  if (!isOpen || !position) return null;

  const presetPercentages = [25, 50, 75, 100];

  return (
    <>
      {/* Overlay */}
      <button
        type="button"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] border-0 p-0 cursor-pointer"
        onClick={onClose}
        disabled={isLoading}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[#242735] rounded-[16px] w-full max-w-[400px] shadow-lg overflow-hidden pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-[20px] py-[16px] border-b border-[rgba(22,22,22,0.06)]">
            <h3 className="font-['SF_Pro_Rounded:Semibold',sans-serif] text-[18px] text-[#dde2f6]">
              Sell Position
            </h3>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 flex items-center justify-center text-[rgba(221,226,246,0.5)] hover:text-[#dde2f6] transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-[20px]">
            {/* Position Info */}
            <div className="flex items-start gap-[12px] mb-[20px] p-[12px] bg-[#191b25] rounded-[12px]">
              <div className="w-[40px] h-[40px] rounded-[8px] overflow-hidden shrink-0 bg-[#242735]">
                {position.icon ? (
                  <ImageWithFallback
                    src={position.icon}
                    alt=""
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2768FC] via-[#5483F0] to-[#9D4EDD]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-['SF_Pro_Rounded:Semibold',sans-serif] text-[13px] text-[#dde2f6] leading-[1.3] line-clamp-2">
                  {position.title}
                </h4>
                <div className="flex items-center gap-[6px] mt-[4px]">
                  <span
                    className={`px-[6px] py-[1px] rounded-[4px] text-[10px] font-['SF_Pro_Rounded:Semibold',sans-serif] ${
                      position.outcome.toLowerCase() === "yes"
                        ? "bg-[rgba(16,185,129,0.15)] text-[#10b981]"
                        : "bg-[rgba(239,68,68,0.15)] text-[#ef4444]"
                    }`}
                  >
                    {position.outcome}
                  </span>
                  <span className="text-[11px] text-[rgba(221,226,246,0.5)]">
                    {position.size.toFixed(1)} shares @ ${position.curPrice.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Selector */}
            <div className="mb-[20px]">
              <label className="block font-['SF_Pro_Rounded:Semibold',sans-serif] text-[12px] text-[rgba(221,226,246,0.6)] mb-[8px]">
                Amount to sell
              </label>

              {/* Percentage Slider */}
              <div className="flex items-center gap-[12px] mb-[12px]">
                <button
                  type="button"
                  onClick={() => handlePercentageChange(percentage - 5)}
                  disabled={isLoading || percentage <= 1}
                  className="w-[36px] h-[36px] flex items-center justify-center bg-[#191b25] rounded-[8px] text-[#72D0ED] hover:bg-[rgba(114,208,237,0.1)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex-1">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={percentage}
                    onChange={(e) => handlePercentageChange(parseInt(e.target.value))}
                    disabled={isLoading}
                    className="w-full h-[6px] bg-[#191b25] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#72D0ED] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handlePercentageChange(percentage + 5)}
                  disabled={isLoading || percentage >= 100}
                  className="w-[36px] h-[36px] flex items-center justify-center bg-[#191b25] rounded-[8px] text-[#72D0ED] hover:bg-[rgba(114,208,237,0.1)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Preset Buttons */}
              <div className="flex gap-[8px]">
                {presetPercentages.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPercentage(p)}
                    disabled={isLoading}
                    className={`flex-1 py-[8px] rounded-[8px] font-['SF_Pro_Rounded:Semibold',sans-serif] text-[12px] transition-colors cursor-pointer ${
                      percentage === p
                        ? "bg-[#72D0ED] text-[#0e1219]"
                        : "bg-[#191b25] text-[rgba(221,226,246,0.6)] hover:text-[#dde2f6]"
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#191b25] rounded-[12px] p-[16px] mb-[20px]">
              <div className="flex justify-between items-center mb-[8px]">
                <span className="font-['SF_Pro_Rounded:Semibold',sans-serif] text-[12px] text-[rgba(221,226,246,0.6)]">
                  Selling
                </span>
                <span className="font-['SF_Pro_Rounded:Semibold',sans-serif] text-[14px] text-[#dde2f6]">
                  {shareAmount.toFixed(2)} shares ({percentage}%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-['SF_Pro_Rounded:Semibold',sans-serif] text-[12px] text-[rgba(221,226,246,0.6)]">
                  Est. Proceeds
                </span>
                <span className="font-['SF_Pro_Rounded:Semibold',sans-serif] text-[18px] text-[#10b981]">
                  ~${estimatedValue.toFixed(2)}
                </span>
              </div>
              <p className="mt-[8px] text-[11px] text-[rgba(221,226,246,0.4)]">
                Final amount may vary based on market conditions
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-[12px]">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-[12px] rounded-[10px] bg-[#191b25] text-[#dde2f6] font-['SF_Pro_Rounded:Semibold',sans-serif] text-[14px] hover:bg-[#242735] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading || shareAmount <= 0}
                className="flex-1 py-[12px] rounded-[10px] bg-[#ef4444] hover:bg-[#dc2626] disabled:bg-[rgba(239,68,68,0.3)] text-white disabled:text-[rgba(255,255,255,0.5)] font-['SF_Pro_Rounded:Semibold',sans-serif] text-[14px] transition-colors cursor-pointer flex items-center justify-center gap-[8px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Selling...
                  </>
                ) : (
                  "Confirm Sell"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

