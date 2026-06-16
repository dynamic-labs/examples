"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  formatCurrency,
  formatTokenAmount,
  getExplorerUrl,
  getNetworkName,
  openExternalLink,
} from "@/lib/utils";
import { Transaction } from "@/types";
import { useKYCStatus } from "@/lib/hooks/useKYCStatus";

interface TrackingStep {
  step: string;
  status?: string;
  transaction_hash?: string;
  completed_at?: string;
  provider_name?: string;
  provider_transaction_id?: string;
  provider_status?: string;
  estimated_time_of_arrival?: string;
}

export default function TransactionHistory() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { receiverId } = useKYCStatus();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const expandedTxRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    expandedTxRef.current = expandedTx;
  }, [expandedTx]);

  const fetchTransactions = useCallback(
    async (preserveExpandedState = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          wallet_address: address || "",
          limit: "50",
        });

        if (receiverId) {
          params.append("receiver_id", receiverId);
        }

        const response = await fetch(`/api/transactions?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setTransactions(data.transactions);

          // If we're preserving expanded state and the current expanded transaction
          // no longer exists in the new data, clear the expanded state
          if (preserveExpandedState && expandedTxRef.current) {
            const expandedTransactionExists = data.transactions.some(
              (tx: Transaction) => tx.id === expandedTxRef.current
            );
            if (!expandedTransactionExists) {
              setExpandedTx(null);
              expandedTxRef.current = null;
            }
          }
        } else {
          setTransactions([]);
          if (preserveExpandedState) {
            setExpandedTx(null);
            expandedTxRef.current = null;
          }
        }
      } catch {
        setTransactions([]);
        if (preserveExpandedState) {
          setExpandedTx(null);
          expandedTxRef.current = null;
        }
      } finally {
        setLoading(false);
      }
    },
    [address, receiverId]
  );

  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions();
    }
  }, [isConnected, address, receiverId, fetchTransactions]);

  useEffect(() => {
    if (!autoRefresh || !isConnected || !address) return;

    const hasProcessingTx = transactions.some(
      (tx) => tx.status === "processing"
    );
    if (!hasProcessingTx) return;

    const interval = setInterval(() => {
      fetchTransactions(true); // Preserve expanded state during auto-refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [
    autoRefresh,
    isConnected,
    address,
    receiverId,
    transactions,
    fetchTransactions,
  ]);

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "processing":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTrackingSteps = (tx: Transaction) => {
    const steps: Array<{ name: string; step: TrackingStep; order: number }> =
      [];

    if (tx.tracking?.transaction) {
      steps.push({
        name: "Transaction",
        step: tx.tracking.transaction as TrackingStep,
        order: 1,
      });
    }

    if (tx.tracking?.payment) {
      steps.push({
        name: "Payment",
        step: tx.tracking.payment as TrackingStep,
        order: 2,
      });
    }

    if (tx.tracking?.liquidity) {
      steps.push({
        name: "Liquidity",
        step: tx.tracking.liquidity as TrackingStep,
        order: 3,
      });
    }

    if (tx.tracking?.complete) {
      steps.push({
        name: "Complete",
        step: tx.tracking.complete as TrackingStep,
        order: 4,
      });
    }

    if (tx.tracking?.partner_fee) {
      steps.push({
        name: "Partner Fee",
        step: tx.tracking.partner_fee as TrackingStep,
        order: 5,
      });
    }

    return steps.sort((a, b) => a.order - b.order);
  };

  const getStepStatus = (step: TrackingStep) => {
    if (step.completed_at) return "completed";
    if (step.status === "failed") return "failed";
    if (step.step === "processing" || step.step === "on_hold")
      return "processing";
    return "pending";
  };

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "processing":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getEstimatedTime = (step: TrackingStep) => {
    if (step.estimated_time_of_arrival) {
      const eta = step.estimated_time_of_arrival;
      switch (eta) {
        case "5_min":
          return "~5 minutes";
        case "1_business_day":
          return "~1 business day";
        case "3_business_days":
          return "~3 business days";
        default:
          return eta.replace(/_/g, " ");
      }
    }
    return null;
  };

  const renderTransactionHash = (txHash: string, label: string = "TX") => {
    const explorerUrl = getExplorerUrl(txHash, chainId);

    if (explorerUrl) {
      return (
        <button
          onClick={() => openExternalLink(explorerUrl)}
          className="text-xs text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors"
          title={`View transaction on ${getNetworkName(chainId)}`}
        >
          {label}: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </button>
      );
    }

    return (
      <div className="text-xs text-primary" title="Transaction hash">
        {label}: {txHash.slice(0, 10)}...{txHash.slice(-8)}
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="bg-card rounded-xl shadow-lg p-6 w-full border">
        <h3 className="text-xl font-semibold text-card-foreground mb-4">
          Transaction History
        </h3>
        <p className="text-muted-foreground text-center py-8">
          Connect your wallet to view transaction history.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-lg p-6 w-full border">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-card-foreground">
          Transaction History
        </h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-input"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => fetchTransactions(true)}
            disabled={loading}
            className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No transactions found. Complete a conversion or payin to see
          transaction history here.
        </p>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => {
            const isExpanded = expandedTx === tx.id;
            const trackingSteps = getTrackingSteps(tx);

            return (
              <div key={tx.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.type === "payin"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary/10 text-secondary-foreground"
                        }`}
                      >
                        {tx.type === "payin" ? "Payin" : "Payout"}
                      </span>
                      <span className="font-medium text-card-foreground">
                        {formatTokenAmount(tx.fromAmount.toString())}{" "}
                        {tx.fromCurrency}
                      </span>
                      <svg
                        className="w-4 h-4 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                      <span className="font-medium text-card-foreground">
                        {tx.toCurrency === "USD" ||
                        tx.toCurrency === "EUR" ||
                        tx.toCurrency === "GBP"
                          ? formatCurrency(tx.toAmount, tx.toCurrency)
                          : `${formatTokenAmount(tx.toAmount.toString())} ${
                              tx.toCurrency
                            }`}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {formatDate(tx.timestamp)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                      <span>
                        {tx.type === "payin" ? "Payin" : "Payout"} ID:{" "}
                        {tx.type === "payin" ? tx.payinId : tx.payoutId}
                      </span>
                      {tx.network && (
                        <>
                          <span>•</span>
                          <span>{tx.network}</span>
                        </>
                      )}
                    </div>
                    {tx.txHash && (
                      <div className="mt-1">
                        {renderTransactionHash(tx.txHash)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        tx.status
                      )}`}
                    >
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                    <button
                      onClick={() => {
                        setExpandedTx(isExpanded ? null : tx.id);
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <svg
                        className={`w-4 h-4 transform transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Quick Status Indicators */}
                {trackingSteps.length > 0 && (
                  <div className="flex gap-1 mb-2">
                    {trackingSteps.map((stepInfo, idx) => {
                      const stepStatus = getStepStatus(stepInfo.step);
                      return (
                        <div
                          key={idx}
                          className={`w-6 h-2 rounded-full ${
                            stepStatus === "completed"
                              ? "bg-green-400"
                              : stepStatus === "processing"
                              ? "bg-yellow-400"
                              : stepStatus === "failed"
                              ? "bg-red-400"
                              : "bg-gray-200"
                          }`}
                          title={`${stepInfo.name}: ${stepInfo.step.step}`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Payin-specific info */}
                {tx.type === "payin" && tx.memoCode && (
                  <div className="text-xs text-primary mt-1">
                    Memo Code: {tx.memoCode}
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 border-t border-border pt-4">
                    {/* Tracking Steps */}
                    {trackingSteps.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-card-foreground mb-2">
                          Tracking Steps
                        </h4>
                        <div className="space-y-2">
                          {trackingSteps.map((stepInfo, idx) => {
                            const stepStatus = getStepStatus(stepInfo.step);
                            const estimatedTime = getEstimatedTime(
                              stepInfo.step
                            );

                            return (
                              <div key={idx} className="flex items-start gap-3">
                                <div
                                  className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center ${
                                    stepStatus === "completed"
                                      ? "bg-green-100 text-green-600"
                                      : stepStatus === "processing"
                                      ? "bg-yellow-100 text-yellow-600"
                                      : stepStatus === "failed"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  {stepStatus === "completed" && (
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                  {stepStatus === "processing" && (
                                    <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse" />
                                  )}
                                  {stepStatus === "failed" && (
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-card-foreground">
                                      {stepInfo.name}
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${getStepColor(
                                        stepStatus
                                      )}`}
                                    >
                                      {stepInfo.step.step.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                  {stepInfo.step.status &&
                                    stepInfo.step.status !==
                                      stepInfo.step.step && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Status: {stepInfo.step.status}
                                      </div>
                                    )}
                                  {estimatedTime && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      ETA: {estimatedTime}
                                    </div>
                                  )}
                                  {stepInfo.step.provider_name && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Provider: {stepInfo.step.provider_name}
                                    </div>
                                  )}
                                  {stepInfo.step.completed_at && (
                                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                      Completed:{" "}
                                      {formatDate(
                                        new Date(
                                          stepInfo.step.completed_at
                                        ).getTime()
                                      )}
                                    </div>
                                  )}
                                  {stepInfo.step.transaction_hash && (
                                    <div className="mt-1">
                                      {renderTransactionHash(
                                        stepInfo.step.transaction_hash
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Additional Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {/* Banking Details for Payins */}
                      {tx.type === "payin" && tx.bankingDetails && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">
                            Banking Details:
                          </span>
                          <div className="text-card-foreground mt-1">
                            <div>
                              Account: {tx.bankingDetails.account_number}
                            </div>
                            <div>
                              Routing: {tx.bankingDetails.routing_number}
                            </div>
                            <div>Type: {tx.bankingDetails.account_type}</div>
                            <div>
                              Beneficiary: {tx.bankingDetails.beneficiary.name}
                            </div>
                            <div>
                              Bank: {tx.bankingDetails.receiving_bank.name}
                            </div>
                          </div>
                        </div>
                      )}

                      {tx.fees &&
                        (tx.fees.total_fee_amount ||
                          tx.fees.partner_fee_amount) && (
                          <div>
                            <span className="text-muted-foreground">Fees:</span>
                            <div className="text-card-foreground">
                              {tx.fees.total_fee_amount && (
                                <div>
                                  Total:{" "}
                                  {tx.toCurrency === "USD" ||
                                  tx.toCurrency === "EUR" ||
                                  tx.toCurrency === "GBP"
                                    ? formatCurrency(
                                        tx.fees.total_fee_amount,
                                        tx.toCurrency
                                      )
                                    : `${formatTokenAmount(
                                        tx.fees.total_fee_amount.toString()
                                      )} ${tx.toCurrency}`}
                                </div>
                              )}
                              {tx.fees.partner_fee_amount && (
                                <div>
                                  Partner:{" "}
                                  {tx.toCurrency === "USD" ||
                                  tx.toCurrency === "EUR" ||
                                  tx.toCurrency === "GBP"
                                    ? formatCurrency(
                                        tx.fees.partner_fee_amount,
                                        tx.toCurrency
                                      )
                                    : `${formatTokenAmount(
                                        tx.fees.partner_fee_amount.toString()
                                      )} ${tx.toCurrency}`}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {tx.recipient &&
                        (tx.recipient.first_name ||
                          tx.recipient.legal_name) && (
                          <div>
                            <span className="text-muted-foreground">
                              Recipient:
                            </span>
                            <div className="text-card-foreground">
                              {tx.recipient.first_name && tx.recipient.last_name
                                ? `${tx.recipient.first_name} ${tx.recipient.last_name}`
                                : tx.recipient.legal_name}
                            </div>
                            {tx.recipient.account_number && (
                              <div className="text-xs text-muted-foreground">
                                Account: ***
                                {tx.recipient.account_number.slice(-4)}
                              </div>
                            )}
                          </div>
                        )}

                      {tx.receiverLocalAmount &&
                        tx.receiverLocalAmount !== tx.toAmount && (
                          <div>
                            <span className="text-muted-foreground">
                              Local Amount:
                            </span>
                            <div className="text-card-foreground">
                              {tx.toCurrency === "USD" ||
                              tx.toCurrency === "EUR" ||
                              tx.toCurrency === "GBP"
                                ? formatCurrency(
                                    tx.receiverLocalAmount,
                                    tx.toCurrency
                                  )
                                : `${formatTokenAmount(
                                    tx.receiverLocalAmount.toString()
                                  )} ${tx.toCurrency}`}
                            </div>
                          </div>
                        )}

                      {tx.description && (
                        <div>
                          <span className="text-muted-foreground">
                            Description:
                          </span>
                          <div className="text-card-foreground">
                            {tx.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
