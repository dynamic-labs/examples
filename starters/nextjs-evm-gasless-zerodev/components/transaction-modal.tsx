"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TransactionModalProps {
  isSuccess: boolean;
  onClose: () => void;
}

export function TransactionModal({
  isSuccess,
  onClose,
}: TransactionModalProps) {
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => onClose(), 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  return (
    <div
      className="absolute inset-0 bg-white flex flex-col h-full z-[10000] text-center rounded-[1.5rem] pointer-events-auto"
      onClick={isSuccess ? onClose : undefined}
    >
      <div className="flex-1 flex flex-col items-center px-6 pt-10">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-8 ${
            isSuccess ? "bg-[#4779ff]" : "bg-gray-100"
          }`}
        >
          {isSuccess ? (
            <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          ) : (
            <div className="w-6 h-6 border-2 border-[#4779ff] border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <h2 className="text-lg text-gray-800 mb-4">
          {isSuccess ? "Transaction Successful!" : "Processing Transaction..."}
        </h2>

        {isSuccess ? (
          <>
            <p className="text-lg font-medium text-gray-600 mb-3">
              100 USDC minted
            </p>
            <div className="w-full bg-[#e7edff] text-[#4779ff] rounded-lg px-6 py-3 mb-8">
              <p className="text-xs text-center">
                Your balance may take up to 30s to refresh.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 mb-12">
            Please wait while we process your transaction...
          </p>
        )}
      </div>
      {isSuccess && (
        <div className="px-6 pb-8">
          <Button
            onClick={onClose}
            className="bg-[#4779ff] hover:bg-[#3b6cff] text-white px-12 py-4 font-semibold w-full cursor-pointer"
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
