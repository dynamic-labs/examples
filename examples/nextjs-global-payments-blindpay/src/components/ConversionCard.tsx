"use client";

import { useState, useEffect } from "react";
import { formatTokenAmount } from "@/lib/utils";
import { config } from "@/lib/config";

interface ConversionCardProps {
  title: string;
  fromCurrency: string;
  toCurrency: string;
  fromOptions: readonly string[];
  toOptions: readonly string[];
  onConvert: (data: ConversionData) => void;
  isLoading?: boolean;
}

export interface ConversionData {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
}

export default function ConversionCard({
  title,
  fromCurrency: initialFromCurrency,
  toCurrency: initialToCurrency,
  fromOptions,
  toOptions,
  onConvert,
  isLoading = false,
}: ConversionCardProps) {
  const [fromCurrency, setFromCurrency] = useState(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState(initialToCurrency);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [rate, setRate] = useState<number>(0);
  const [rateDetails, setRateDetails] = useState<{
    blindpay_rate?: number;
    commercial_rate?: number;
    flat_fee?: number;
    percentage_fee?: number;
  } | null>(null);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [network] = useState<string>(config.blindpayDefaults.network);

  useEffect(() => {
    const fetchRateAsync = async () => {
      setFetchingRate(true);
      setRateError(null);
      try {
        const amount = parseFloat(fromAmount) || 1000;

        if (amount < 1) {
          setRateError("Please enter an amount of at least 1");
          setRate(0);
          setRateDetails(null);
          return;
        }

        const response = await fetch(
          `/api/rates?from=${fromCurrency}&to=${toCurrency}&amount=${amount}&currency_type=sender&network=${network}`
        );
        const data = await response.json();

        if (data.rate) {
          setRate(data.rate);
          setRateDetails(data);
          setRateError(null);
        } else {
          setRateDetails(null);
          setRate(0);
          setRateError(data.error || "Failed to fetch exchange rate");
        }
      } catch (error) {
        setRateDetails(null);
        setRate(0);
        setRateError(error instanceof Error ? error.message : "Network error");
      } finally {
        setFetchingRate(false);
      }
    };

    if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      const timeoutId = setTimeout(fetchRateAsync, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [fromCurrency, toCurrency, fromAmount, network]);

  useEffect(() => {
    if (fromAmount && rate > 0) {
      const calculated = parseFloat(fromAmount) * rate;
      setToAmount(calculated.toString());
    } else {
      setToAmount("");
    }
  }, [fromAmount, rate]);

  const handleFromAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFromAmount(value);
    }
  };

  const handleConvert = () => {
    if (fromAmount && toAmount && rate > 0) {
      onConvert({
        fromCurrency,
        toCurrency,
        fromAmount: parseFloat(fromAmount),
        toAmount: parseFloat(toAmount),
      });
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount("");
    setToAmount("");
  };

  return (
    <div className="bg-card rounded-xl shadow-lg p-6 w-full max-w-md border">
      <h3 className="text-xl font-semibold text-card-foreground mb-6 text-center">
        {title}
      </h3>

      {/* From Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-card-foreground mb-2">
          From
        </label>
        <div className="flex gap-2">
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
          >
            {fromOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={fromAmount}
            onChange={(e) => handleFromAmountChange(e.target.value)}
            placeholder="0.00"
            className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
          />
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={swapCurrencies}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors duration-200"
          aria-label="Swap currencies"
        >
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </button>
      </div>

      {/* To Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-card-foreground mb-2">
          To
        </label>
        <div className="flex gap-2">
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
          >
            {toOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={toAmount}
            readOnly
            placeholder="0.00"
            className="flex-1 px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
          />
        </div>
      </div>

      {/* Error Display */}
      {rateError && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-sm text-destructive">
            <div className="font-medium">⚠️ Rate Error</div>
            <div className="mt-1">{rateError}</div>
          </div>
        </div>
      )}

      {/* Rate Display */}
      {rate > 0 && (
        <div className="mb-4 p-3 bg-primary/5 rounded-lg">
          <div className="text-sm text-primary">
            <div className="flex justify-between">
              <span>Exchange Rate:</span>
              <span className="font-medium">
                1 {fromCurrency} = {formatTokenAmount(rate.toString())}{" "}
                {toCurrency}
              </span>
            </div>
            {rateDetails && rateDetails.blindpay_rate && (
              <div className="mt-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Service Rate:</span>
                  <span>
                    {formatTokenAmount(rateDetails.blindpay_rate.toString())}
                  </span>
                </div>
                {rateDetails.flat_fee && (
                  <div className="flex justify-between">
                    <span>Flat Fee:</span>
                    <span>
                      {rateDetails.flat_fee / 100} {fromCurrency}
                    </span>
                  </div>
                )}
                {rateDetails.percentage_fee && (
                  <div className="flex justify-between">
                    <span>Percentage Fee:</span>
                    <span>
                      {(rateDetails.percentage_fee * 100).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {fetchingRate && (
              <span className="ml-2 text-primary/70">Updating...</span>
            )}
          </div>
        </div>
      )}

      {/* Convert Button */}
      <button
        onClick={handleConvert}
        disabled={!fromAmount || !toAmount || isLoading || fetchingRate}
        className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? "Processing..." : "Convert"}
      </button>
    </div>
  );
}
