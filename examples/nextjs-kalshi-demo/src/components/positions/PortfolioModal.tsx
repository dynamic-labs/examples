"use client";

import { AnimatePresence, motion } from "motion/react";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { useUserPositions } from "@/lib/hooks/useUserPositions";
import { useIsLoggedIn } from "@/lib/dynamic";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PortfolioModal({ isOpen, onClose }: PortfolioModalProps) {
  const isLoggedIn = useIsLoggedIn();
  const { positions, orders, isLoading } = useUserPositions();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#12131a] rounded-[16px] border border-[#262a34] z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#262a34]">
              <h2 className="font-['Clash_Display',sans-serif] text-xl font-bold text-white">
                Portfolio
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[#252630] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[rgba(221,226,246,0.6)]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {!isLoggedIn ? (
                <div className="text-center py-8">
                  <p className="font-['Clash_Display',sans-serif] text-[rgba(221,226,246,0.5)]">
                    Connect your wallet to view your portfolio
                  </p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8">
                  <p className="font-['Clash_Display',sans-serif] text-[rgba(221,226,246,0.5)]">
                    Loading positions...
                  </p>
                </div>
              ) : positions.length === 0 && orders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-[#8b5cf6]" />
                  </div>
                  <p className="font-['Clash_Display',sans-serif] text-[rgba(221,226,246,0.5)] mb-2">
                    No positions yet
                  </p>
                  <p className="font-['Clash_Display',sans-serif] text-[rgba(221,226,246,0.3)] text-sm">
                    Start trading to build your portfolio
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Positions */}
                  {positions.length > 0 && (
                    <div>
                      <h3 className="font-['Clash_Display',sans-serif] text-sm font-semibold text-[rgba(221,226,246,0.5)] mb-3">
                        POSITIONS
                      </h3>
                      <div className="space-y-2">
                        {positions.map((position) => (
                          <div
                            key={position.marketId}
                            className="p-4 rounded-[12px] bg-[#1a1b23] border border-[#262a34]"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-['Clash_Display',sans-serif] text-white font-medium text-sm truncate max-w-[200px]">
                                {position.question}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  position.side === "yes"
                                    ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                                    : "bg-[#ef4444]/20 text-[#ef4444]"
                                }`}
                              >
                                {position.side.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-['Clash_Display',sans-serif] text-[rgba(221,226,246,0.5)] text-sm">
                                {position.size} shares @ {position.avgPrice}¢
                              </span>
                              <div className="flex items-center gap-1">
                                {position.pnl >= 0 ? (
                                  <TrendingUp className="w-4 h-4 text-[#14b8a6]" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-[#ef4444]" />
                                )}
                                <span
                                  className={`font-['Clash_Display',sans-serif] text-sm font-semibold ${
                                    position.pnl >= 0
                                      ? "text-[#14b8a6]"
                                      : "text-[#ef4444]"
                                  }`}
                                >
                                  {position.pnl >= 0 ? "+" : ""}$
                                  {position.pnl.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Orders */}
                  {orders.length > 0 && (
                    <div>
                      <h3 className="font-['Clash_Display',sans-serif] text-sm font-semibold text-[rgba(221,226,246,0.5)] mb-3">
                        ACTIVE ORDERS
                      </h3>
                      <div className="space-y-2">
                        {orders.map((order) => (
                          <div
                            key={order.id}
                            className="p-4 rounded-[12px] bg-[#1a1b23] border border-[#262a34]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-['Clash_Display',sans-serif] text-white font-medium text-sm">
                                {order.ticker}
                              </span>
                              <span className="font-['Clash_Display',sans-serif] text-[#f59e0b] text-xs font-semibold px-2 py-1 rounded-full bg-[#f59e0b]/20">
                                {order.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-['Clash_Display',sans-serif] text-[rgba(221,226,246,0.5)] text-sm">
                                {order.side.toUpperCase()} {order.size} @{" "}
                                {order.price}¢
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

