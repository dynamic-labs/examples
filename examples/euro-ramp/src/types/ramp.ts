/**
 * Ramp types and interfaces
 */

export type RampType = "onramp" | "offramp";
export type TabType = "market" | "quote" | "transactions";

export interface RegisteredWallet {
  id: string;
  address: string;
  blockchain: string;
  status?: string;
}

export interface RegisteredBank {
  id: string;
  iban?: string;
  account_identifier?: { iban?: string; type?: string };
  currency?: string;
  status?: string;
  label?: string;
  bank_name?: string;
  holder_name?: string;
}

export interface Chain {
  id: string;
  name: string;
}

export interface Token {
  id: string;
  name: string;
}

export interface FiatCurrency {
  id: string;
  name: string;
  symbol: string;
}

export interface QuoteData {
  id?: string;
  data?: {
    id?: string;
    source_amount?: number;
    destination_amount?: number;
    source_currency?: string;
    destination_currency?: string;
    exchange_rate?: string;
    expires_at?: string;
    fees?: {
      total_fee?: number;
    };
  };
  source_amount?: number;
  destination_amount?: number;
  source_currency?: string;
  destination_currency?: string;
  exchange_rate?: string;
  expires_at?: string;
  fees?: {
    total_fee?: number;
  };
}

export interface TransactionResult {
  data?: {
    id?: string;
    status?: string;
    payment_instructions?: {
      account_number?: string;
      bank_name?: string;
      bic?: string;
      beneficiary_name?: string;
      address?: string;
      phone?: string;
    };
  };
  id?: string;
  status?: string;
  payment_instructions?: {
    account_number?: string;
    bank_name?: string;
    bic?: string;
    beneficiary_name?: string;
    address?: string;
    phone?: string;
  };
}
