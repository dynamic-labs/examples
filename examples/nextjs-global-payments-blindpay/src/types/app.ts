// Application-specific types for the BlindPay frontend

export interface Transaction {
  id: string;
  type: "payin" | "payout";
  payoutId?: string;
  payinId?: string;
  quoteId?: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  receiverLocalAmount?: number;
  status: "processing" | "completed" | "failed";
  timestamp: number;
  txHash?: string;
  completedAt?: number;
  network: string;
  description?: string;
  memoCode?: string;
  bankingDetails?: {
    routing_number: string;
    account_number: string;
    account_type: string;
    beneficiary: {
      name: string;
      address_line_1: string;
      address_line_2: string;
    };
    receiving_bank: {
      name: string;
      address_line_1: string;
      address_line_2: string;
    };
  };

  // Detailed tracking information
  tracking?: {
    transaction?: {
      step: string;
      status: string;
      transaction_hash?: string;
      completed_at?: string;
    };
    payment?: {
      step: string;
      provider_name?: string;
      provider_transaction_id?: string;
      provider_status?: string;
      estimated_time_of_arrival?: string;
      completed_at?: string;
    };
    liquidity?: {
      step: string;
      provider_transaction_id?: string;
      provider_status?: string;
      estimated_time_of_arrival?: string;
      completed_at?: string;
    };
    complete?: {
      step: string;
      status?: string;
      transaction_hash?: string;
      completed_at?: string;
    };
    partner_fee?: {
      step: string;
      transaction_hash?: string;
      completed_at?: string;
    };
  };

  // Fee information
  fees?: {
    partner_fee_amount?: number;
    total_fee_amount?: number;
  };

  // Recipient information
  recipient?: {
    first_name?: string;
    last_name?: string;
    legal_name?: string;
    account_number?: string;
    routing_number?: string;
    country?: string;
    account_type?: string;
    type?: string;
  };

  // Raw data for debugging
  rawPayout?: unknown;
  rawPayin?: unknown;
}

export interface BankingDetails {
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
}

export interface ConversionResult {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  status: string;
  walletAddress?: string;
  txHash?: string;
  timestamp?: number;
  estimatedCompletion?: number;
  blindpay?: {
    quoteId?: string;
    payoutId?: string;
    approvalTxHash?: string;
    payinId?: string;
    memoCode?: string;
    bankingDetails?: {
      routing_number: string;
      account_number: string;
      account_type: string;
      beneficiary: {
        name: string;
        address_line_1: string;
        address_line_2: string;
      };
      receiving_bank: {
        name: string;
        address_line_1: string;
        address_line_2: string;
      };
    };
    fullResponse?: unknown;
  };
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  blindpay_rate?: number;
  commercial_rate?: number;
  flat_fee?: number | null;
  percentage_fee?: number;
  result_amount?: number;
  request_amount?: number;
  quote_type?: "fx" | "full";
  full_quote?: unknown;
}

export interface ConversionData {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
}

export interface BankAccount {
  id: string;
  name: string;
  account_number: string;
  routing_number?: string;
  account_type: string;
  account_class: string;
  country: string;
}
