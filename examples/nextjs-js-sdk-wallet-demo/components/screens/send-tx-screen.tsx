"use client";

import { useState } from "react";
import {
  ExternalLink,
  CheckCircle,
  ArrowLeft,
  Send,
  AlertCircle,
  Zap,
  Copy,
  Check,
} from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/error-message";
import { NetworkSelector } from "@/components/wallet/network-selector";
import { useSendTransaction } from "@/hooks/use-mutations";
import { useWalletAccounts } from "@/hooks/use-wallet-accounts";
import { useActiveNetwork } from "@/hooks/use-active-network";
import { useGasSponsorship } from "@/hooks/use-gas-sponsorship";
import { truncateAddress, copyToClipboard } from "@/lib/utils";
import type { NetworkData } from "@/lib/dynamic-client";
import type { NavigationReturn } from "@/hooks/use-navigation";

interface SendTxScreenProps {
  walletAddress: string;
  chain: string;
  navigation: NavigationReturn;
  txResult?: {
    txHash: string;
    networkData: NetworkData;
  };
}

/**
 * Transaction result view - shown after successful transaction
 */
function TransactionResultView({
  txHash,
  networkData,
  explorerUrl,
  onClose,
}: {
  txHash: string;
  networkData: NetworkData;
  explorerUrl?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(txHash);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Truncate hash for display
  const truncatedHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;

  return (
    <WidgetCard
      icon={
        <CheckCircle
          className="w-[18px] h-[18px] text-(--widget-success)"
          strokeWidth={1.5}
        />
      }
      title="Transaction Sent"
      subtitle="Your transaction was submitted successfully"
      onClose={onClose}
    >
      <div className="space-y-3">
        {/* Network info */}
        <div className="flex items-center gap-2 p-3 bg-(--widget-row-bg) rounded-(--widget-radius)">
          {networkData.iconUrl && (
            <img
              src={networkData.iconUrl}
              alt={networkData.displayName}
              className="w-6 h-6 rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-(--widget-muted) tracking-[-0.12px]">
              Network
            </p>
            <p className="text-sm font-medium text-(--widget-fg) tracking-[-0.14px]">
              {networkData.displayName}
            </p>
          </div>
        </div>

        {/* Transaction hash */}
        <div className="p-3 bg-(--widget-row-bg) rounded-(--widget-radius)">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-(--widget-muted) tracking-[-0.12px] mb-1">
                Transaction Hash
              </p>
              <p className="text-sm font-mono text-(--widget-fg) truncate">
                {truncatedHash}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-full hover:bg-black/5 text-(--widget-muted) hover:text-(--widget-fg) transition-colors cursor-pointer shrink-0"
              aria-label="Copy transaction hash"
            >
              {copied ? (
                <Check className="w-4 h-4 text-(--widget-success)" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          {explorerUrl && (
            <a
              href={`${explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-9 px-3 text-xs font-medium text-(--widget-accent) bg-(--widget-accent)/5 rounded-(--widget-radius) hover:bg-(--widget-accent)/10 transition-colors"
            >
              View on Explorer
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <Button variant="secondary" className="w-full" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
            Back to Wallets
          </Button>
        </div>
      </div>
    </WidgetCard>
  );
}

/**
 * Address subtitle with copy button
 */
function AddressSubtitle({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <span className="inline-flex items-center gap-1">
      From {truncateAddress(address)}
      <button
        type="button"
        onClick={handleCopy}
        className="p-0.5 rounded hover:bg-black/5 text-(--widget-muted) hover:text-(--widget-fg) transition-colors cursor-pointer"
        aria-label="Copy address"
      >
        {copied ? (
          <Check className="w-3 h-3 text-(--widget-success)" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
    </span>
  );
}

/**
 * Send transaction screen with form and result display
 *
 * For EVM: Uses useGasSponsorship to determine wallet selection
 * For Solana: Standard transaction flow
 */
export function SendTxScreen({
  walletAddress,
  chain,
  navigation,
  txResult,
}: SendTxScreenProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const { walletAccounts } = useWalletAccounts();
  const sendTx = useSendTransaction();

  // Find a wallet for this address (used for network queries and Solana)
  const walletForAddress =
    walletAccounts.find(
      (w) => w.address.toLowerCase() === walletAddress.toLowerCase(),
    ) || null;

  // Get active network
  const { networkData, refetch: refetchNetwork } =
    useActiveNetwork(walletForAddress);

  // For EVM: Check sponsorship and get the appropriate wallet
  const { isSponsored, isLoading, walletToUse, zerodevWallet } =
    useGasSponsorship(
      chain === "EVM" ? walletAddress : undefined,
      walletAccounts,
      networkData,
    );

  // The wallet to use for transactions
  const walletAccount =
    chain === "EVM" ? walletToUse || walletForAddress : walletForAddress;

  // Transaction Result View
  if (txResult) {
    const explorerUrl = txResult.networkData.blockExplorerUrls?.[0];

    return (
      <TransactionResultView
        txHash={txResult.txHash}
        networkData={txResult.networkData}
        explorerUrl={explorerUrl}
        onClose={navigation.goToDashboard}
      />
    );
  }

  // Send Form View
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !amount.trim() || !walletAccount || !networkData)
      return;

    try {
      const txHash = await sendTx.mutateAsync({
        walletAccount,
        amount,
        recipient,
        networkData,
      });

      navigation.goToTxResult(txHash, networkData);
    } catch {
      // Error handled by mutation
    }
  };

  if (!walletAccount) {
    return (
      <WidgetCard
        icon={
          <AlertCircle
            className="w-[18px] h-[18px] text-(--widget-error)"
            strokeWidth={1.5}
          />
        }
        title="Error"
        onClose={navigation.goToDashboard}
      >
        <p className="text-sm text-(--widget-error)">Wallet not found</p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      icon={
        <Send
          className="w-[18px] h-[18px] text-(--widget-fg)"
          strokeWidth={1.5}
        />
      }
      title="Send Transaction"
      subtitle={<AddressSubtitle address={walletAddress} />}
      onClose={navigation.goToDashboard}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Network Selector (EVM only) */}
        {chain === "EVM" && (
          <div className="p-3 bg-(--widget-row-bg) border border-(--widget-border) rounded-(--widget-radius)">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-(--widget-fg) tracking-[-0.14px]">
                  Network
                </span>
                {zerodevWallet &&
                  (isLoading ? (
                    <span className="text-[10px] text-(--widget-muted)">
                      Checking gas...
                    </span>
                  ) : isSponsored ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-(--widget-accent)">
                      <Zap className="w-3 h-3" />
                      Gas Sponsored
                    </span>
                  ) : (
                    <span className="text-[10px] text-(--widget-muted)">
                      Standard transaction
                    </span>
                  ))}
              </div>
              <NetworkSelector
                walletAccount={walletAccount}
                onNetworkChange={refetchNetwork}
              />
            </div>
          </div>
        )}

        {/* Recipient Address */}
        <Input
          label="Recipient Address"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder={chain === "EVM" ? "0x..." : "Enter address"}
          disabled={sendTx.isPending}
        />

        {/* Amount */}
        <Input
          label={`Amount (${networkData?.nativeCurrency?.symbol || chain})`}
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.001"
          pattern="^[0-9]*\.?[0-9]*$"
          disabled={sendTx.isPending}
        />

        <Button
          type="submit"
          className="w-full"
          loading={sendTx.isPending}
          disabled={!recipient.trim() || !amount.trim() || !networkData}
        >
          Send Transaction
        </Button>

        <ErrorMessage error={sendTx.error} />
      </form>
    </WidgetCard>
  );
}
