"use client";

import { useState, useEffect, useCallback } from "react";
import { useKYCStatus } from "@/lib/hooks/useKYCStatus";
import {
  AccountType,
  AccountClass,
  PaymentMethodType,
} from "@/types/stablepay";
import { useDynamicContext } from "@/lib/dynamic";

interface BankAccount {
  id: string;
  type: string;
  name: string;
  account_number: string;
  routing_number?: string;
  account_type: string;
  account_class: string;
  country: string;
  created_at: string;
}

interface BlockchainWallet {
  id: string;
  name: string;
  network: string;
  address: string;
  is_account_abstraction: boolean;
  created_at: string;
}

export default function PaymentMethods({
  onUpdate,
}: {
  onUpdate?: () => void;
}) {
  const { receiverId } = useKYCStatus();
  const { primaryWallet } = useDynamicContext();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [blockchainWallets, setBlockchainWallets] = useState<
    BlockchainWallet[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"bank" | "blockchain">("bank");
  const [showAddForm, setShowAddForm] = useState(false);
  const [walletAdditionMethod, setWalletAdditionMethod] = useState<
    "secure" | "direct"
  >("secure");

  const [bankForm, setBankForm] = useState({
    type: PaymentMethodType.ACH,
    name: "Test Bank Account",
    beneficiary_name: "John Doe",
    account_number: "1234567890",
    routing_number: "021000021",
    account_type: AccountType.CHECKING,
    account_class: AccountClass.INDIVIDUAL,
    country: "US",
    address_line_1: "123 Main Street",
    city: "San Francisco",
    state_province_region: "CA",
    postal_code: "94105",
  });

  const [walletForm, setWalletForm] = useState({
    name: "",
    network: "base_sepolia",
    address: "",
    is_account_abstraction: false,
  });

  const populateWithDummyData = () => {
    setBankForm({
      type: PaymentMethodType.ACH,
      name: "Test Bank Account",
      beneficiary_name: "John Doe",
      account_number: "1234567890",
      routing_number: "021000021",
      account_type: AccountType.CHECKING,
      account_class: AccountClass.INDIVIDUAL,
      country: "US",
      address_line_1: "123 Main Street",
      city: "San Francisco",
      state_province_region: "CA",
      postal_code: "94105",
    });
  };

  const fetchPaymentMethods = useCallback(async () => {
    if (!receiverId) return;

    setIsLoading(true);
    try {
      const bankResponse = await fetch(
        `/api/payment-methods/bank-accounts?receiverId=${receiverId}`
      );

      if (bankResponse.ok) {
        const bankData = await bankResponse.json();
        setBankAccounts(bankData.bankAccounts || []);
      }

      const walletResponse = await fetch(
        `/api/payment-methods/blockchain-wallets?receiverId=${receiverId}`
      );

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setBlockchainWallets(walletData.blockchainWallets || []);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [receiverId]);

  useEffect(() => {
    if (receiverId) {
      fetchPaymentMethods();
    }
  }, [receiverId, fetchPaymentMethods]);

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/payment-methods/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          ...bankForm,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setBankAccounts((prev) => [...prev, result.bankAccount]);
        setShowAddForm(false);
        setBankForm({
          type: PaymentMethodType.ACH,
          name: "",
          beneficiary_name: "",
          account_number: "",
          routing_number: "",
          account_type: AccountType.CHECKING,
          account_class: AccountClass.INDIVIDUAL,
          country: "US",
          address_line_1: "",
          city: "",
          state_province_region: "",
          postal_code: "",
        });

        onUpdate?.();
      } else {
        const error = await response.json();
        alert(`Failed to add bank account: ${error.message}`);
      }
    } catch {
      alert("Failed to add bank account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBlockchainWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId) return;

    setIsLoading(true);
    try {
      let requestBody: {
        receiverId: string;
        name: string;
        network: string;
        is_account_abstraction: boolean;
        address?: string;
        signature_tx_hash?: string;
      };

      if (walletAdditionMethod === "secure") {
        // Secure method: Get message to sign, sign it, then add wallet
        if (!primaryWallet) {
          alert("Please connect your wallet first");
          return;
        }

        // Step 1: Get the message to sign
        const messageResponse = await fetch(
          `/api/payment-methods/blockchain-wallets/sign-message?receiverId=${receiverId}`
        );

        if (!messageResponse.ok) {
          const error = await messageResponse.json();
          alert(`Failed to get sign message: ${error.error}`);
          return;
        }

        const messageData = await messageResponse.json();
        const messageToSign = messageData.message;

        // Step 2: Sign the message using Dynamic wallet
        const signature = await primaryWallet.signMessage(messageToSign);

        // Step 3: Create request body with signature and address
        requestBody = {
          receiverId,
          name: walletForm.name,
          network: walletForm.network,
          is_account_abstraction: walletForm.is_account_abstraction,
          address: primaryWallet.address,
          signature_tx_hash: signature,
        };
      } else {
        // Direct method: Use the address directly
        if (!walletForm.address) {
          alert("Wallet address is required for direct addition");
          return;
        }

        requestBody = {
          receiverId,
          name: walletForm.name,
          network: walletForm.network,
          is_account_abstraction: walletForm.is_account_abstraction,
          address: walletForm.address,
        };
      }

      const response = await fetch("/api/payment-methods/blockchain-wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        setBlockchainWallets((prev) => [...prev, result.blockchainWallet]);
        setShowAddForm(false);
        setWalletForm({
          name: "",
          network: "base_sepolia",
          address: "",
          is_account_abstraction: false,
        });

        onUpdate?.();
      } else {
        const error = await response.json();
        alert(`Failed to add blockchain wallet: ${error.error}`);
      }
    } catch (error) {
      alert(
        `Failed to add blockchain wallet: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBankAccount = async (accountId: string) => {
    if (
      !receiverId ||
      !confirm("Are you sure you want to delete this bank account?")
    )
      return;

    try {
      const response = await fetch(
        `/api/payment-methods/bank-accounts/${accountId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId }),
        }
      );

      if (response.ok) {
        setBankAccounts((prev) =>
          prev.filter((account) => account.id !== accountId)
        );
        onUpdate?.();
      } else {
        alert("Failed to delete bank account");
      }
    } catch {
      alert("Failed to delete bank account");
    }
  };

  const handleDeleteBlockchainWallet = async (walletId: string) => {
    if (
      !receiverId ||
      !confirm("Are you sure you want to delete this blockchain wallet?")
    )
      return;

    try {
      const response = await fetch(
        `/api/payment-methods/blockchain-wallets/${walletId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId }),
        }
      );

      if (response.ok) {
        setBlockchainWallets((prev) =>
          prev.filter((wallet) => wallet.id !== walletId)
        );
        onUpdate?.();
      } else {
        alert("Failed to delete blockchain wallet");
      }
    } catch {
      alert("Failed to delete blockchain wallet");
    }
  };

  if (!receiverId) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl shadow-lg p-6 border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-card-foreground">
          Payment Methods
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          Add at least one payment method to start converting funds
        </p>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Add Payment Method
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("bank")}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === "bank"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Bank Accounts ({bankAccounts.length})
        </button>
        <button
          onClick={() => setActiveTab("blockchain")}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === "blockchain"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Blockchain Wallets ({blockchainWallets.length})
        </button>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                Add{" "}
                {activeTab === "bank" ? "Bank Account" : "Blockchain Wallet"}
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {activeTab === "bank" ? (
              <form onSubmit={handleAddBankAccount} className="space-y-4">
                {/* Dummy Data Button for Testing */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={populateWithDummyData}
                    className="w-full bg-muted text-muted-foreground px-3 py-2 rounded-md hover:bg-muted/80 transition-colors text-sm border border-input"
                  >
                    🧪 Fill with Test Data (Development Only)
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankForm.name}
                    onChange={(e) =>
                      setBankForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="My Bank Account"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Beneficiary Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankForm.beneficiary_name}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        beneficiary_name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={bankForm.type}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        type: e.target.value as PaymentMethodType,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  >
                    <option value="ach">ACH</option>
                    <option value="rtp">RTP</option>
                    <option value="wire">Domestic Wire</option>
                    <option value="transfers_bitso">Transfers 3.0</option>
                    <option value="pix">PIX</option>
                    <option value="ach_cop_bitso">ACH Colombia</option>
                    <option value="spei_bitso">SPEI</option>
                    <option value="international_swift">
                      International Swift
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankForm.account_number}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        account_number: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    value={bankForm.routing_number}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        routing_number: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="123456789"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Account Type
                    </label>
                    <select
                      value={bankForm.account_type}
                      onChange={(e) =>
                        setBankForm((prev) => ({
                          ...prev,
                          account_type: e.target.value as AccountType,
                        }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    >
                      <option value="checking">Checking</option>
                      <option value="saving">Saving</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Account Class
                    </label>
                    <select
                      value={bankForm.account_class}
                      onChange={(e) =>
                        setBankForm((prev) => ({
                          ...prev,
                          account_class: e.target.value as AccountClass,
                        }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    >
                      <option value="individual">Individual</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Country
                  </label>
                  <select
                    value={bankForm.country}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="MX">Mexico</option>
                    <option value="BR">Brazil</option>
                    <option value="AR">Argentina</option>
                    <option value="CO">Colombia</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="CH">Switzerland</option>
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK">Denmark</option>
                    <option value="FI">Finland</option>
                    <option value="AU">Australia</option>
                    <option value="NZ">New Zealand</option>
                    <option value="JP">Japan</option>
                    <option value="KR">South Korea</option>
                    <option value="SG">Singapore</option>
                    <option value="HK">Hong Kong</option>
                    <option value="IN">India</option>
                    <option value="CN">China</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={bankForm.address_line_1}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        address_line_1: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={bankForm.city}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="San Francisco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={bankForm.state_province_region}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        state_province_region: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="CA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={bankForm.postal_code}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        postal_code: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="94101"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 border border-input text-foreground rounded-md hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isLoading ? "Adding..." : "Add Bank Account"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddBlockchainWallet} className="space-y-4">
                {/* Wallet Addition Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Addition Method *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="secure"
                        checked={walletAdditionMethod === "secure"}
                        onChange={(e) =>
                          setWalletAdditionMethod(
                            e.target.value as "secure" | "direct"
                          )
                        }
                        className="h-4 w-4 text-primary focus:ring-ring border-input"
                      />
                      <span className="ml-2 text-sm text-card-foreground">
                        🔐 Secure (Sign Message) - Recommended
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="direct"
                        checked={walletAdditionMethod === "direct"}
                        onChange={(e) =>
                          setWalletAdditionMethod(
                            e.target.value as "secure" | "direct"
                          )
                        }
                        className="h-4 w-4 text-primary focus:ring-ring border-input"
                      />
                      <span className="ml-2 text-sm text-card-foreground">
                        📝 Direct (Enter Address)
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Wallet Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={walletForm.name}
                    onChange={(e) =>
                      setWalletForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="My Polygon Wallet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Network *
                  </label>
                  <select
                    required
                    value={walletForm.network}
                    onChange={(e) =>
                      setWalletForm((prev) => ({
                        ...prev,
                        network: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  >
                    <option value="base_sepolia">Base Sepolia</option>
                    <option value="polygon">Polygon</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="arbitrum">Arbitrum</option>
                    <option value="optimism">Optimism</option>
                    <option value="base">Base</option>
                  </select>
                </div>

                {walletAdditionMethod === "direct" && (
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Wallet Address *
                    </label>
                    <input
                      type="text"
                      required={walletAdditionMethod === "direct"}
                      value={walletForm.address}
                      onChange={(e) =>
                        setWalletForm((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                      placeholder="0x..."
                    />
                  </div>
                )}

                {walletAdditionMethod === "secure" && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-primary">
                      🔐 <strong>Secure Method:</strong> You&apos;ll be prompted
                      to sign a message with your connected wallet. This method
                      doesn&apos;t require you to enter your wallet address and
                      is more secure.
                    </p>
                    {!primaryWallet && (
                      <p className="text-sm text-destructive mt-2">
                        ⚠️ Please connect your wallet first to use the secure
                        method.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAccountAbstraction"
                    checked={walletForm.is_account_abstraction}
                    onChange={(e) =>
                      setWalletForm((prev) => ({
                        ...prev,
                        is_account_abstraction: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                  />
                  <label
                    htmlFor="isAccountAbstraction"
                    className="ml-2 block text-sm text-card-foreground"
                  >
                    Is Account Abstraction Wallet
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 border border-input text-foreground rounded-md hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      (walletAdditionMethod === "secure" && !primaryWallet)
                    }
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isLoading
                      ? "Adding..."
                      : walletAdditionMethod === "secure"
                      ? "Sign & Add Wallet"
                      : "Add Wallet"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      ) : (
        <div>
          {activeTab === "bank" ? (
            <div>
              {bankAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No bank accounts added yet.</p>
                  <p className="text-sm">
                    Add a bank account to receive fiat payments.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="border border-border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-card-foreground">
                            {account.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {account.account_type} • {account.account_class} •{" "}
                            {account.country}
                          </p>
                          <p className="text-sm text-muted-foreground/70">
                            Account: ****{account.account_number.slice(-4)} |
                            Routing: {account.routing_number}
                          </p>
                          <p className="text-xs text-muted-foreground/50">
                            Added{" "}
                            {new Date(account.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteBankAccount(account.id)}
                          className="text-destructive hover:text-destructive/80 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {blockchainWallets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No blockchain wallets added yet.</p>
                  <p className="text-sm">
                    Add a blockchain wallet to receive crypto payments.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blockchainWallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="border border-border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-card-foreground">
                            {wallet.name}
                          </h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {wallet.network} Network
                            {wallet.is_account_abstraction &&
                              " • Account Abstraction"}
                          </p>
                          <p className="text-sm text-muted-foreground/70 font-mono">
                            {wallet.address.slice(0, 6)}...
                            {wallet.address.slice(-4)}
                          </p>
                          <p className="text-xs text-muted-foreground/50">
                            Added{" "}
                            {new Date(wallet.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleDeleteBlockchainWallet(wallet.id)
                          }
                          className="text-destructive hover:text-destructive/80 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
