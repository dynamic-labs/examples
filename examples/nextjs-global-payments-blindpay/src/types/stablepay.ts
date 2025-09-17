// API Types
// These types are based on the API documentation and responses

// Enums for common values

export enum PayinStep {
  CREATE_RECEIVER = "create_receiver",
  ADD_WALLET = "add_wallet",
  CREATE_QUOTE = "create_quote",
  INITIATE_PAYIN = "initiate_payin",
}

export enum BankingDetailsType {
  QUOTE = "quote",
  INITIATE = "initiate",
}

export enum ReceiverType {
  INDIVIDUAL = "individual",
  BUSINESS = "business",
}

export enum KycType {
  STANDARD = "standard",
  ENHANCED = "enhanced",
}

export enum KycStatus {
  PENDING = "pending",
  VERIFYING = "verifying",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum PaymentMethod {
  ACH = "ach",
  WIRE = "wire",
}

export enum Network {
  ETHEREUM = "ethereum",
  POLYGON = "polygon",
  ARBITRUM = "arbitrum",
}

export enum AccountType {
  CHECKING = "checking",
  SAVING = "saving",
}

export enum AccountClass {
  INDIVIDUAL = "individual",
  BUSINESS = "business",
}

export enum Currency {
  USD = "USD",
  USDC = "USDC",
  USDT = "USDT",
  USDB = "USDB",
  BRL = "BRL",
  MXN = "MXN",
  COP = "COP",
  ARS = "ARS",
}

export enum IdDocType {
  PASSPORT = "PASSPORT",
  DRIVERS_LICENSE = "DRIVERS_LICENSE",
  NATIONAL_ID = "NATIONAL_ID",
  VOTER_ID = "VOTER_ID",
}

export enum ProofOfAddressDocType {
  UTILITY_BILL = "UTILITY_BILL",
  BANK_STATEMENT = "BANK_STATEMENT",
  RENTAL_AGREEMENT = "RENTAL_AGREEMENT",
  INSURANCE_DOCUMENT = "INSURANCE_DOCUMENT",
}

export enum PurposeOfTransactions {
  PERSONAL_OR_LIVING_EXPENSES = "personal_or_living_expenses",
  BUSINESS_TRANSACTIONS = "business_transactions",
  INVESTMENT = "investment",
  EDUCATION = "education",
  TRAVEL = "travel",
}

export enum SourceOfFundsDocType {
  BUSINESS_INCOME = "business_income",
  SALARY = "salary",
  INVESTMENT_RETURNS = "investment_returns",
  INHERITANCE = "inheritance",
  GIFT = "gift",
}

export enum PaymentMethodType {
  ACH = "ach",
  RTP = "rtp",
  WIRE = "wire",
  TRANSFERS_BITSO = "transfers_bitso",
  PIX = "pix",
  ACH_COP_BITSO = "ach_cop_bitso",
  SPEI_BITSO = "spei_bitso",
  INTERNATIONAL_SWIFT = "international_swift",
}

// Supported currencies according to API specification
export const SUPPORTED_CURRENCIES = [
  "USDC",
  "USDT",
  "USDB",
  "BRL",
  "USD",
  "MXN",
  "COP",
  "ARS",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// Currency type for API requests
export type CurrencyType = "sender" | "receiver";

export interface StablePayPayinQuote {
  id: string;
  amount: string;
  fees: {
    [key: string]: unknown;
  };
  request_amount: number;
  token: string;
  payment_method: string;
  currency_type: string;
  cover_fees: boolean;
  blockchain_wallet_id: string;
}

export interface StablePayPayin {
  id: string;
  status: string;
  memo_code: string;
  blindpay_bank_details: {
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
  payin_quote_id: string;
  created_at: string;
  updated_at: string;
}

export interface StablePayReceiver {
  id: string;
  type: ReceiverType;
  kyc_type: KycType;
  kyc_status: KycStatus;
  kyc_warnings: Array<{
    code: string | null;
    message: string | null;
    resolution_status: string | null;
    warning_id: string | null;
  }>;
  email: string;
  tax_id: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state_province_region: string;
  country: string;
  postal_code: string;
  ip_address: string;
  image_url?: string;
  phone_number: string;
  proof_of_address_doc_type: ProofOfAddressDocType;
  proof_of_address_doc_file?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  id_doc_country: string;
  id_doc_type: IdDocType;
  id_doc_front_file?: string;
  id_doc_back_file?: string;
  // Business-specific fields
  legal_name?: string;
  alternate_name?: string;
  formation_date?: string;
  website?: string;
  owners?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state_province_region: string;
    country: string;
    postal_code: string;
    id_doc_country: string;
    id_doc_type: IdDocType;
    id_doc_front_file?: string;
    id_doc_back_file?: string;
  }>;
  incorporation_doc_file?: string;
  proof_of_ownership_doc_file?: string;
  source_of_funds_doc_type?: SourceOfFundsDocType;
  source_of_funds_doc_file?: string;
  individual_holding_doc_front_file?: string;
  purpose_of_transactions?: PurposeOfTransactions;
  purpose_of_transactions_explanation?: string;
  external_id?: string;
  instance_id: string;
  tos_id: string;
  aiprise_validation_key: string;
  created_at: string;
  updated_at: string;
  limit?: {
    per_transaction: number;
    daily: number;
    monthly: number;
  };
}

export interface BlindPayBlockchainWallet {
  id: string;
  name: string;
  network: Network;
  address: string;
  is_account_abstraction: boolean;
  receiver_id: string;
  created_at: string;
  updated_at: string;
}

export interface BlindPayTOS {
  id: string;
  url: string;
  accepted_at?: string;
  status: string;
}

export interface BlindPayQuoteResponse {
  commercial_quotation: number;
  blindpay_quotation: number;
  result_amount: number;
  instance_flat_fee: number | null;
  instance_percentage_fee: number;
}

export interface BlindPayPayout {
  receiver_id: string;
  id: string;
  status: string;
  sender_wallet_address: string;
  signed_transaction?: string;
  quote_id: string;
  instance_id: string;
  tracking_transaction?: {
    step: string;
    status: string;
    transaction_hash?: string;
    completed_at?: string;
  };
  tracking_payment?: {
    step: string;
    provider_name?: string;
    provider_transaction_id?: string;
    provider_status?: string;
    estimated_time_of_arrival?: string;
    completed_at?: string;
  };
  tracking_liquidity?: {
    step: string;
    provider_transaction_id?: string;
    provider_status?: string;
    estimated_time_of_arrival?: string;
    completed_at?: string;
  };
  tracking_complete?: {
    step: string;
    status?: string;
    transaction_hash?: string;
    completed_at?: string;
  };
  tracking_partner_fee?: {
    step: string;
    transaction_hash?: string;
    completed_at?: string;
  };
  created_at: string;
  updated_at: string;
  image_url?: string;
  first_name?: string;
  last_name?: string;
  legal_name?: string;
  network: Network;
  token: Currency;
  description?: string;
  sender_amount: number;
  receiver_amount: number;
  partner_fee_amount?: number;
  commercial_quotation?: number;
  blindpay_quotation?: number;
  total_fee_amount?: number;
  receiver_local_amount?: number;
  currency: Currency;
  transaction_document_file?: string;
  transaction_document_type?: string;
  transaction_document_id?: string;
  name?: string;
  type?: string;
  pix_key?: string;
  account_number?: string;
  routing_number?: string;
  country?: string;
  account_class?: AccountClass;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state_province_region?: string;
  postal_code?: string;
  account_type?: AccountType;
  ach_cop_beneficiary_first_name?: string;
  ach_cop_bank_account?: string;
  ach_cop_bank_code?: string;
  ach_cop_beneficiary_last_name?: string;
  ach_cop_document_id?: string;
  ach_cop_document_type?: string;
  ach_cop_email?: string;
  beneficiary_name?: string;
  spei_clabe?: string;
  spei_protocol?: string;
  spei_institution_code?: string;
  swift_beneficiary_country?: string;
  swift_code_bic?: string;
  swift_account_holder_name?: string;
  swift_account_number_iban?: string;
  transfers_account?: string;
  transfers_type?: string;
  has_virtual_account?: boolean;
}

export interface PayoutsResponse {
  data: BlindPayPayout[];
  pagination: {
    has_more: boolean;
    next_page?: string;
    prev_page?: string;
  };
}
