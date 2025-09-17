import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const openExternalLink = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export const getExplorerUrl = (txHash: string, chainId?: number) => {
  if (!chainId) return null;

  const explorers: { [key: number]: string } = {
    1: `https://etherscan.io/tx/${txHash}`,
    10: `https://optimistic.etherscan.io/tx/${txHash}`,
    137: `https://polygonscan.com/tx/${txHash}`,
    42161: `https://arbiscan.io/tx/${txHash}`,
    8453: `https://basescan.org/tx/${txHash}`,
    84532: `https://sepolia.basescan.org/tx/${txHash}`, // Base Sepolia
    56: `https://bscscan.com/tx/${txHash}`,
    43114: `https://snowtrace.io/tx/${txHash}`,
    250: `https://ftmscan.com/tx/${txHash}`,
    100: `https://gnosisscan.io/tx/${txHash}`,
    1101: `https://zkevm.polygonscan.com/tx/${txHash}`,
    7777777: `https://explorer.zora.energy/tx/${txHash}`,
    11155420: `https://sepolia.optimism.io/tx/${txHash}`,
    11155111: `https://sepolia.etherscan.io/tx/${txHash}`,
    80001: `https://mumbai.polygonscan.com/tx/${txHash}`,
  };

  return explorers[chainId] || null;
};

export const getNetworkName = (chainId?: number) => {
  if (!chainId) return "blockchain explorer";

  const networkNames: { [key: number]: string } = {
    1: "Ethereum",
    10: "Optimism",
    137: "Polygon",
    42161: "Arbitrum",
    8453: "Base",
    84532: "Base Sepolia",
    56: "BSC",
    43114: "Avalanche",
    250: "Fantom",
    100: "Gnosis",
    1101: "Polygon zkEVM",
    7777777: "Zora",
    11155420: "Optimism Sepolia",
    11155111: "Ethereum Sepolia",
    80001: "Polygon Mumbai",
  };

  return networkNames[chainId] || "blockchain explorer";
};

export const formatAmount = (amount: string, decimals: number) => {
  try {
    return (BigInt(amount) / BigInt(10 ** decimals)).toString();
  } catch {
    return "0";
  }
};

export const formatCurrency = (
  amount: number,
  currency: string = "USD"
): string => {
  // Handle non-standard currency codes like USDB, USDC, USDT
  if (currency === "USDB" || currency === "USDC" || currency === "USDT") {
    return (
      new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(amount) + ` ${currency}`
    );
  }

  // Handle standard fiat currencies
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  } catch {
    // Fallback for invalid currency codes
    return (
      new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(amount) + ` ${currency}`
    );
  }
};

export const formatTokenAmount = (
  amount: string | number,
  decimals: number = 6
): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(decimals);
};

export const truncateAddress = (
  address: string,
  start: number = 6,
  end: number = 4
): string => {
  if (!address) return "";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

/**
 * API Error Handling Utilities
 */

export interface ApiErrorResponse {
  error: string;
  details?: string;
  code?: string;
  solution?: string;
  status?: number;
}

export interface ApiErrorInfo {
  message: string;
  code: string;
  solution: string;
  isRecoverable: boolean;
  requiresAction: boolean;
  actionRequired: string;
}

/**
 * Parse API error responses and provide user-friendly information
 */
export function parseApiError(
  status: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _errorText?: string
): ApiErrorInfo {
  switch (status) {
    case 402:
      return {
        message: "Payment Required - Bank Account Validation Failed",
        code: "BANK_ACCOUNT_VALIDATION_FAILED",
        solution:
          "Complete KYC process and ensure your account has a valid bank account with sufficient funding",
        isRecoverable: true,
        requiresAction: true,
        actionRequired: "Complete KYC and add banking information",
      };

    case 401:
      return {
        message: "Unauthorized - Invalid API Credentials",
        code: "UNAUTHORIZED",
        solution: "Check your API configuration and credentials",
        isRecoverable: false,
        requiresAction: true,
        actionRequired: "Update API configuration",
      };

    case 400:
      return {
        message: "Bad Request - Invalid Parameters",
        code: "INVALID_REQUEST",
        solution: "Verify all required parameters are provided and valid",
        isRecoverable: true,
        requiresAction: true,
        actionRequired: "Check request parameters",
      };

    case 404:
      return {
        message: "Resource Not Found",
        code: "NOT_FOUND",
        solution:
          "The requested resource (bank account, receiver, etc.) does not exist",
        isRecoverable: true,
        requiresAction: true,
        actionRequired: "Verify resource exists or create new one",
      };

    case 422:
      return {
        message: "Unprocessable Entity - Incomplete Information",
        code: "INCOMPLETE_INFORMATION",
        solution: "The resource exists but is missing required information",
        isRecoverable: true,
        requiresAction: true,
        actionRequired: "Complete missing information",
      };

    case 429:
      return {
        message: "Rate Limit Exceeded",
        code: "RATE_LIMIT_EXCEEDED",
        solution: "Too many requests. Please wait before trying again",
        isRecoverable: true,
        requiresAction: false,
        actionRequired: "Wait and retry",
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        message: "Service Unavailable",
        code: "SERVICE_UNAVAILABLE",
        solution: "Service is temporarily unavailable. Please try again later",
        isRecoverable: true,
        requiresAction: false,
        actionRequired: "Wait and retry",
      };

    default:
      return {
        message: "Unknown Error Occurred",
        code: "UNKNOWN_ERROR",
        solution:
          "An unexpected error occurred. Please try again or contact support",
        isRecoverable: true,
        requiresAction: false,
        actionRequired: "Contact support if problem persists",
      };
  }
}

/**
 * Check if an error is related to bank account validation
 */
export function isBankAccountError(status: number, code?: string): boolean {
  return (
    status === 402 ||
    code === "BANK_ACCOUNT_REQUIRED" ||
    code === "BANK_ACCOUNT_VALIDATION_FAILED"
  );
}

/**
 * Check if an error requires user action (KYC, bank account setup, etc.)
 */
export function requiresUserAction(status: number, code?: string): boolean {
  return (
    isBankAccountError(status, code) ||
    status === 401 ||
    status === 400 ||
    status === 404 ||
    status === 422
  );
}

/**
 * Get user-friendly error message for display in UI
 */
export function getUserFriendlyErrorMessage(errorInfo: ApiErrorInfo): string {
  if (errorInfo.requiresAction) {
    return `${errorInfo.message}. ${errorInfo.actionRequired}.`;
  }
  return errorInfo.message;
}

/**
 * Get actionable solution for user
 */
export function getActionableSolution(errorInfo: ApiErrorInfo): string {
  if (errorInfo.requiresAction) {
    return `${errorInfo.solution}. ${errorInfo.actionRequired}.`;
  }
  return errorInfo.solution;
}

/**
 * Check if user needs to complete KYC process
 */
export function needsKYCCompletion(status: number, code?: string): boolean {
  return isBankAccountError(status, code) || code === "KYC_REQUIRED";
}

/**
 * Check if user needs to add banking information
 */
export function needsBankingInfo(status: number, code?: string): boolean {
  return isBankAccountError(status, code) || code === "BANK_ACCOUNT_REQUIRED";
}

/**
 * Get next steps for user based on error
 */
export function getNextSteps(errorInfo: ApiErrorInfo): string[] {
  const steps: string[] = [];

  if (errorInfo.code === "BANK_ACCOUNT_VALIDATION_FAILED") {
    steps.push("1. Complete KYC verification process");
    steps.push("2. Add valid banking information to your account");
    steps.push("3. Ensure sufficient funding in your account");
    steps.push("4. Try your request again");
  } else if (errorInfo.code === "UNAUTHORIZED") {
    steps.push("1. Check your API credentials");
    steps.push("2. Verify your instance ID and API key");
    steps.push("3. Ensure your account is active");
    steps.push("4. Contact support if issues persist");
  } else if (errorInfo.code === "INVALID_REQUEST") {
    steps.push("1. Verify all required parameters are provided");
    steps.push("2. Check parameter formats and values");
    steps.push("3. Ensure currency pairs are supported");
    steps.push("4. Verify amount is within acceptable range");
  }

  return steps;
}
