"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, CheckCircle, ArrowLeft, Send } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingCard } from "@/components/ui/loading-card";
import { ErrorCard } from "@/components/ui/error-card";
import { MfaCodeInput } from "@/components/ui/mfa-code-input";
import { CopyButton } from "@/components/ui/copy-button";
import { ErrorMessage } from "@/components/error-message";
import { NetworkSelectorSection } from "@/components/wallet/network-selector-section";
import { AssetSelector } from "@/components/wallet/asset-selector";
import { Authorize7702Screen } from "@/components/screens/authorize-7702-screen";
import { useSendTransaction } from "@/hooks/use-mutations";
import { useWalletAccounts } from "@/hooks/use-wallet-accounts";
import { useActiveNetwork } from "@/hooks/use-active-network";
import { useGasSponsorship } from "@/hooks/use-gas-sponsorship";
import { use7702Authorization } from "@/hooks/use-7702-authorization";
import { cn, truncateAddress } from "@/lib/utils";
import {
  type NetworkData,
  type TokenBalanceInfo,
  getTokenBalances,
  isSvmGasSponsorshipEnabled,
} from "@/lib/dynamic";
import type { NavigationReturn } from "@/hooks/use-navigation";
import { useMfaStatus, isMfaRequiredError } from "@/hooks/use-mfa-status";
import { SetupMfaScreen } from "@/components/screens/setup-mfa-screen";
import type { SignAuthorizationReturnType } from "@/lib/transactions/sign-7702-authorization";

interface SendTxScreenProps {
  walletAddress: string;
  chain: string;
  navigation: NavigationReturn;
  txResult?: {
    txHash: string;
    networkData: NetworkData;
  };
  fromMfaSetup?: boolean;
  onBack?: () => void;
}

/** Build a block explorer link, preserving query params (e.g. ?cluster=devnet) */
function buildExplorerTxUrl(explorerUrl: string, txHash: string): string {
  const url = new URL(explorerUrl);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/tx/${txHash}`;
  return url.toString();
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
            <CopyButton
              text={txHash}
              label="Copy transaction hash"
              className="shrink-0 rounded-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          {explorerUrl && (
            <a
              href={buildExplorerTxUrl(explorerUrl, txHash)}
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
  return (
    <span className="inline-flex items-center gap-1">
      From {truncateAddress(address)}
      <CopyButton text={address} size="sm" label="Copy address" />
    </span>
  );
}

/**
 * Screen state for the send transaction flow
 */
type ScreenState =
  | { view: "loading"; message: string }
  | { view: "authorize" }
  | { view: "mfa-setup" }
  | { view: "result" }
  | { view: "error"; message: string }
  | { view: "form" };

/**
 * Send transaction screen with form and result display
 *
 * For EVM:
 * - Checks 7702 authorization, redirects to authorize if needed
 * - Uses useGasSponsorship to determine wallet selection
 * - Requires MFA code for ZeroDev transactions (if MFA device configured)
 *
 * For Solana: Standard transaction flow
 */
export function SendTxScreen({
  walletAddress,
  chain,
  navigation,
  txResult,
  fromMfaSetup = false,
  onBack,
}: SendTxScreenProps) {
  const handleClose = onBack ?? navigation.goToDashboard;

  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  // Asset selection — stores the address of the user-picked asset (null = use default)
  const [pickedAssetAddress, setPickedAssetAddress] = useState<string | null>(
    null,
  );
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState("");
  // Track when user just completed MFA setup (internally or from navigation)
  const [justCompletedMfaSetup, setJustCompletedMfaSetup] =
    useState(fromMfaSetup);
  // Signed EIP-7702 authorization (passed from Authorize7702Screen)
  const [signedAuth, setSignedAuth] =
    useState<SignAuthorizationReturnType | null>(null);

  // Hooks
  const { walletAccounts } = useWalletAccounts();
  const sendTx = useSendTransaction();
  const {
    requiresMfa,
    isLoading: mfaLoading,
    refetch: refetchMfaStatus,
  } = useMfaStatus();

  const isEvm = chain === "EVM";

  // Find any wallet for this address (for network queries)
  const anyWallet =
    walletAccounts.find(
      (w) => w.address.toLowerCase() === walletAddress.toLowerCase(),
    ) || null;

  // Get active network
  const { networkData, refetch: refetchNetwork } = useActiveNetwork(anyWallet);

  // For EVM: Get the right wallet based on sponsorship
  const {
    isSponsored,
    isLoading: sponsorshipLoading,
    walletToUse,
    zerodevWallet,
  } = useGasSponsorship(
    isEvm ? walletAddress : undefined,
    walletAccounts,
    networkData,
  );

  // Check if EIP-7702 authorization is needed (EVM only)
  const hasZerodevWallet = !!zerodevWallet;
  const {
    isAuthorized,
    isLoading: authLoading,
    invalidate: invalidateAuth,
  } = use7702Authorization(
    hasZerodevWallet ? walletAddress : undefined,
    networkData,
  );

  // The wallet account to use for transactions
  const walletAccount = isEvm ? walletToUse || anyWallet : anyWallet;

  // Fetch all balances (native + tokens) for the asset selector
  const { data: tokenBalances, isLoading: tokensLoading } = useQuery({
    queryKey: [
      "tokenBalances",
      walletAccount?.address,
      chain,
      networkData?.networkId,
    ],
    queryFn: async () => {
      if (!walletAccount || !networkData) return [];
      return getTokenBalances({
        address: walletAccount.address,
        chain,
        networkId: Number(networkData.networkId),
      });
    },
    enabled: !!walletAccount && !!networkData,
  });

  // Derive the selected token from query data:
  // - If user picked one, find it by address
  // - Otherwise default: native token (if multiple) or the only asset
  const selectedToken = useMemo(() => {
    if (!tokenBalances?.length) return null;
    if (pickedAssetAddress != null) {
      return (
        tokenBalances.find((t) => t.address === pickedAssetAddress) ?? null
      );
    }
    if (tokenBalances.length === 1) return tokenBalances[0];
    return tokenBalances.find((t) => t.isNative) ?? tokenBalances[0];
  }, [tokenBalances, pickedAssetAddress]);

  // Effective token address and decimals — derived from selectedToken for the
  // dropdown path, or from manual state for the manual entry path.
  const effectiveTokenAddress = useManualEntry
    ? tokenAddress
    : selectedToken?.isNative
      ? ""
      : (selectedToken?.address ?? "");
  const effectiveTokenDecimals = useManualEntry
    ? tokenDecimals
    : selectedToken?.isNative
      ? ""
      : String(selectedToken?.decimals ?? "");

  // Handle asset selection from the dropdown
  const handleSelectToken = (token: TokenBalanceInfo) => {
    setPickedAssetAddress(token.address);
    if (token.isNative) {
      setTokenAddress("");
      setTokenDecimals("");
    } else {
      setTokenAddress(token.address);
      setTokenDecimals(String(token.decimals));
    }
  };

  // Check for SVM gas sponsorship (Solana)
  const svmSponsored = !isEvm && isSvmGasSponsorshipEnabled();

  // Determine sponsorship status for display (EVM and Solana)
  const sponsorshipStatus = useMemo(() => {
    if (isEvm) {
      if (sponsorshipLoading) return { type: "loading" as const };
      if (isSponsored && zerodevWallet) return { type: "sponsored" as const };
      return { type: "standard" as const };
    }
    return svmSponsored ? { type: "sponsored" as const } : undefined;
  }, [isEvm, sponsorshipLoading, isSponsored, zerodevWallet, svmSponsored]);

  // Authorization is ready if already authorized on-chain OR we have a signed auth
  const isAuthReady = isAuthorized || !!signedAuth;

  // Determine screen state
  const screenState = ((): ScreenState => {
    // Show result if transaction completed
    if (txResult) {
      return { view: "result" };
    }

    // Show MFA setup if user requested it
    if (showMfaSetup) {
      return { view: "mfa-setup" };
    }

    // Loading states
    if (mfaLoading) {
      return { view: "loading", message: "Checking MFA status..." };
    }
    if (sponsorshipLoading) {
      return { view: "loading", message: "Checking gas sponsorship..." };
    }
    if (isEvm && hasZerodevWallet && isSponsored && authLoading) {
      return { view: "loading", message: "Checking authorization..." };
    }

    // Error state if wallet not found
    if (!walletAccount) {
      return { view: "error", message: "Wallet not found" };
    }

    // EVM authorization needed ONLY when MFA is enabled
    // Without MFA, the SDK handles authorization automatically during transaction
    // With MFA, we pre-sign to avoid double MFA prompts (one for auth, one for tx)
    const needsAuthorization =
      isEvm && hasZerodevWallet && isSponsored && !isAuthReady && requiresMfa;
    if (needsAuthorization) return { view: "authorize" };

    // Default: show the send form
    return { view: "form" };
  })();

  // Handle network change
  const handleNetworkChange = () => {
    refetchNetwork();
    setMfaCode("");
    setSignedAuth(null);
    setPickedAssetAddress(null);
    setTokenAddress("");
    setTokenDecimals("");
  };

  // Handle authorization success
  const handleAuthSuccess = (auth: SignAuthorizationReturnType) => {
    setSignedAuth(auth);
    setMfaCode(""); // Clear MFA code - user needs a new one for the transaction
  };

  // A token transfer is any non-native asset
  const isTokenTransfer = effectiveTokenAddress.trim() !== "";
  const tokenFieldsValid =
    !isTokenTransfer ||
    (effectiveTokenAddress.trim() && effectiveTokenDecimals.trim());

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !amount.trim() || !walletAccount || !networkData) {
      return;
    }
    if (!tokenFieldsValid) return;
    if (requiresMfa && !mfaCode.trim()) return;

    try {
      const txHash = await sendTx.mutateAsync({
        walletAccount,
        amount,
        recipient,
        networkData,
        mfaCode: requiresMfa ? mfaCode : undefined,
        eip7702Auth: signedAuth ?? undefined,
        tokenAddress: isTokenTransfer
          ? effectiveTokenAddress.trim()
          : undefined,
        tokenDecimals: isTokenTransfer
          ? parseInt(effectiveTokenDecimals, 10)
          : undefined,
        sponsored: svmSponsored || undefined,
      });

      // Clear signed auth after successful transaction
      setSignedAuth(null);
      // Invalidate auth cache so dashboard shows updated status
      invalidateAuth();
      navigation.goToTxResult(txHash, networkData);
    } catch (error) {
      // If MFA required but not set up, show setup screen
      if (isMfaRequiredError(error)) {
        setShowMfaSetup(true);
        return;
      }
      // Clear MFA code on failure so user can try again
      setMfaCode("");
    }
  };

  // Render based on screen state
  switch (screenState.view) {
    case "loading":
      return (
        <LoadingCard
          icon={
            <Send
              className="w-[18px] h-[18px] text-(--widget-fg)"
              strokeWidth={1.5}
            />
          }
          title="Send Transaction"
          subtitle={screenState.message}
          onClose={handleClose}
        />
      );

    case "authorize":
      return (
        <Authorize7702Screen
          walletAddress={walletAddress}
          fromMfaSetup={justCompletedMfaSetup}
          onSuccess={(auth) => {
            setJustCompletedMfaSetup(false);
            handleAuthSuccess(auth);
          }}
          onCancel={handleClose}
          onNeedsMfaSetup={() => setShowMfaSetup(true)}
        />
      );

    case "mfa-setup":
      return (
        <SetupMfaScreen
          onSuccess={() => {
            refetchMfaStatus();
            setShowMfaSetup(false);
            setJustCompletedMfaSetup(true);
          }}
          onCancel={() => setShowMfaSetup(false)}
        />
      );

    case "result":
      if (!txResult) return null;
      return (
        <TransactionResultView
          txHash={txResult.txHash}
          networkData={txResult.networkData}
          explorerUrl={txResult.networkData.blockExplorerUrls?.[0]}
          onClose={handleClose}
        />
      );

    case "error":
      return (
        <ErrorCard
          icon={
            <Send
              className="w-[18px] h-[18px] text-(--widget-error)"
              strokeWidth={1.5}
            />
          }
          message={screenState.message}
          onClose={handleClose}
        />
      );

    case "form":
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
          onClose={handleClose}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Network Selector */}
            {walletAccount && (
              <NetworkSelectorSection
                walletAccount={walletAccount}
                onNetworkChange={handleNetworkChange}
                sponsorship={sponsorshipStatus}
              />
            )}

            {/* Recipient Address */}
            <Input
              label="Recipient Address"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={isEvm ? "0x..." : "Enter address"}
              disabled={sendTx.isPending}
            />

            {/* Amount + inline asset selector */}
            {!useManualEntry ? (
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center justify-between text-xs font-medium text-(--widget-muted) tracking-[-0.12px]">
                  <span>Amount</span>
                  {selectedToken && (
                    <span className="font-normal">
                      Balance: {selectedToken.balance}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    pattern="^[0-9]*\.?[0-9]*$"
                    disabled={sendTx.isPending}
                    className={cn(
                      "w-full h-10 pl-3 pr-30 text-sm",
                      "bg-(--widget-bg) text-(--widget-fg)",
                      "border border-(--widget-border) rounded-(--widget-radius)",
                      "placeholder:text-(--widget-muted)",
                      "focus:outline-none focus:ring-2 focus:ring-(--widget-accent) focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  />
                  <AssetSelector
                    assets={tokenBalances ?? []}
                    selected={selectedToken}
                    onSelect={handleSelectToken}
                    loading={tokensLoading}
                    disabled={sendTx.isPending}
                    onManualEntry={() => {
                      setUseManualEntry(true);
                      setPickedAssetAddress(null);
                      setTokenAddress("");
                      setTokenDecimals("");
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Manual token entry — replaces the amount row */
              <div className="space-y-3 p-3 bg-(--widget-row-bg) border border-(--widget-border) rounded-(--widget-radius)">
                <Input
                  label="Token Address"
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="Enter address"
                  disabled={sendTx.isPending}
                />
                <Input
                  label="Token Decimals"
                  type="text"
                  value={tokenDecimals}
                  onChange={(e) => setTokenDecimals(e.target.value)}
                  placeholder={isEvm ? "18" : "9"}
                  pattern="^[0-9]*$"
                  disabled={sendTx.isPending}
                />
                <Input
                  label="Amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  pattern="^[0-9]*\.?[0-9]*$"
                  disabled={sendTx.isPending}
                />
                <button
                  type="button"
                  onClick={() => {
                    setUseManualEntry(false);
                    setTokenAddress("");
                    setTokenDecimals("");
                  }}
                  className="flex items-center gap-1 text-[10px] text-(--widget-muted) hover:text-(--widget-fg) transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to asset list
                </button>
              </div>
            )}

            {/* MFA Code Input */}
            {requiresMfa && (
              <MfaCodeInput
                value={mfaCode}
                onChange={setMfaCode}
                disabled={sendTx.isPending}
                autoFocus={!!signedAuth}
                contained
                helperMessage={
                  signedAuth
                    ? "Enter a new MFA code to send the transaction."
                    : undefined
                }
              />
            )}

            <Button
              type="submit"
              className="w-full"
              loading={sendTx.isPending}
              disabled={
                !recipient.trim() ||
                !amount.trim() ||
                !networkData ||
                !tokenFieldsValid ||
                (requiresMfa && mfaCode.length !== 6)
              }
            >
              Send Transaction
            </Button>

            <ErrorMessage error={sendTx.error} />
          </form>
        </WidgetCard>
      );
  }
}
