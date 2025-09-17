import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message?: string }).message || String(error);
  }
  return String(error);
}

export function isValidNumber(value: string): boolean {
  if (!value || value.trim() === "") return false;
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}

export function createTxStatusMessage(
  action: string,
  success: boolean,
  error?: string
): string {
  if (success) {
    return `${action} transaction sent!`;
  }
  return `${action} failed: ${error || "Unknown error"}`;
}
