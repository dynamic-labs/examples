import React from "react";

interface MarketsModeSelectorProps {
  mode: "supply" | "withdraw" | "borrow" | "repay";
  onModeChange: (mode: "supply" | "withdraw" | "borrow" | "repay") => void;
}

export function MarketsModeSelector({
  mode,
  onModeChange,
}: MarketsModeSelectorProps) {
  const modes = [
    { key: "supply" as const, label: "Supply" },
    { key: "withdraw" as const, label: "Withdraw" },
    { key: "borrow" as const, label: "Borrow" },
    { key: "repay" as const, label: "Repay" },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-2 w-full">
      {modes.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onModeChange(key)}
          className={`font-normal bg-gray-700 text-gray-400 border-none rounded-lg py-3 cursor-pointer transition-all duration-200 text-sm hover:bg-gray-600 ${
            mode === key
              ? "font-bold bg-blue-600 text-white outline-2 outline-blue-400"
              : ""
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
