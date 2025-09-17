export interface Address {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string; // ISO 3166-1 alpha-2
  country?: string;
}

export type ApplicationStatus =
  | "approved"
  | "pending"
  | "needsInformation"
  | "needsVerification"
  | "manualReview"
  | "denied"
  | "locked"
  | "canceled";

export type CardLimitFrequency =
  | "per24HourPeriod"
  | "per7DayPeriod"
  | "per30DayPeriod"
  | "perYearPeriod"
  | "allTime"
  | "perAuthorization";

export type CardType = "virtual" | "physical";
export type CardStatus = "active" | "inactive";

export interface ApplicationLink {
  url: string;
  params?: Record<string, unknown>;
}

// Create Application
export interface CreateUserApplicationRequest {
  // The initiated application's Rain ID, if previously initiated for this user
  id?: string;

  // Person details
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  nationalId: string; // 9-digit SSN if US
  countryOfIssue: string; // ISO 3166-1 alpha-2
  email: string;
  phoneCountryCode: string; // E.164 country code digits only
  phoneNumber: string; // digits only

  // Address
  address: Address;

  // Wallets (optional unless using Rain-managed solution)
  walletAddress?: string; // EVM address
  solanaAddress?: string;
  tronAddress?: string;
  stellarAddress?: string;
  chainId?: string;
  contractAddress?: string;

  // Metadata
  sourceKey?: string;
  ipAddress: string;
  occupation: string;
  annualSalary: string;
  accountPurpose: string;
  expectedMonthlyVolume: string;
  isTermsOfServiceAccepted: boolean;
  hasExistingDocuments?: boolean;
}

export interface CreateUserApplicationResponse {
  id: string;
  companyId?: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  isTermsOfServiceAccepted: boolean;
  address: Address;
  phoneCountryCode?: string;
  phoneNumber?: string;
  applicationStatus: ApplicationStatus;
  applicationCompletionLink?: ApplicationLink;
  applicationReason?: string;
}

export interface CardLimit {
  frequency: CardLimitFrequency;
  amount: number;
}

export interface CreateCardForUserRequest {
  type: CardType;
  limit: CardLimit;
}

export interface CreateCardForUserResponse {
  id: string;
  userId: string;
  type: CardType;
  status: CardStatus;
  limit: CardLimit;
  last4: string;
  expirationMonth: string;
  expirationYear: string;
}

export interface UserCreditBalanceResponse {
  creditLimit: number;
  pendingCharges: number;
  postedCharges: number;
  balanceDue: number;
  spendingPower: number;
}

export interface CardEncryptedDataResponse {
  encryptedPan: {
    iv: string;
    data: string;
  };
  encryptedCvc: {
    iv: string;
    data: string;
  };
}

export interface UserDepositContractToken {
  address: string;
  balance?: string;
  exchangeRate?: number;
  advanceRate?: number;
}

export interface UserDepositContractResponse {
  id: string;
  chainId: number;
  programAddress?: string | null;
  controllerAddress: string;
  proxyAddress: string;
  depositAddress?: string;
  tokens: UserDepositContractToken[];
  contractVersion: number;
}

export interface UserWithdrawalSignatureRequest {
  chainId: number;
  token: string;
  amount: string;
  adminAddress: string;
  recipientAddress: string;
}

export type WidthdrawalRequestStatus = "pending" | "ready";

export interface UserWithdrawalRequestPending {
  status: "pending";
  retryAfter: number;
}
export type WithdrawAssetParameters = [
  string,
  string,
  string,
  string,
  number,
  string,
  string
];

export interface UserWithdrawalRequest {
  status: "ready";
  signature: {
    data: string;
    salt: string;
  };
  expiresAt: Date;
  sender: string;
  chainId: number;
  parameters: WithdrawAssetParameters;
}

export type UserWithdrawalSignatureResponse =
  | UserWithdrawalRequestPending
  | UserWithdrawalRequest;

// Transaction Response Types
export type TransactionStatus = "pending" | "completed";
export type SpendTransactionStatus =
  | "pending"
  | "reversed"
  | "declined"
  | "completed";

export interface PaymentTransactionData {
  amount: number; // in cents
  currency: string;
  memo?: string;
  chainId?: number;
  walletAddress?: string;
  transactionHash?: string;
  companyId: string;
  userId: string;
  status: TransactionStatus;
  postedAt: string;
}

export interface PaymentTransactionResponse {
  id: string;
  type: "payment";
  payment: PaymentTransactionData;
}

export interface FeeTransactionData {
  amount: number; // in cents
  description?: string;
  companyId: string;
  userId: string;
  postedAt: string; // date-time
}

export interface FeeTransactionResponse {
  id: string;
  type: "fee";
  fee: FeeTransactionData;
}

export interface CollateralTransactionData {
  amount: number; // in cents
  currency: string;
  memo?: string;
  chainId: number;
  walletAddress: string;
  transactionHash: string;
  companyId: string;
  userId: string;
  postedAt: string; // date-time
}

export interface CollateralTransactionResponse {
  id: string;
  type: "collateral";
  collateral: CollateralTransactionData;
}

export interface SpendTransactionData {
  amount: number; // in cents
  currency: string;
  localAmount?: number;
  localCurrency?: string;
  authorizedAmount?: number;
  authorizationMethod?: string;
  memo?: string;
  receipt: boolean;
  merchantName: string;
  merchantCategory: string;
  merchantCategoryCode: string;
  merchantId?: string;
  enrichedMerchantIcon?: string;
  enrichedMerchantName?: string;
  enrichedMerchantCategory?: string;
  cardId: string;
  cardType: CardType;
  companyId: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  status: SpendTransactionStatus;
  declinedReason?: string;
  authorizedAt: string;
  postedAt?: string;
}

export interface SpendTransactionResponse {
  id: string;
  type: "spend";
  spend: SpendTransactionData;
}

export type TransactionResponse =
  | PaymentTransactionResponse
  | FeeTransactionResponse
  | CollateralTransactionResponse
  | SpendTransactionResponse;
