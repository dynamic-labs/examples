import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * True for the one failure that a moment's patience fixes: a freshly approved
 * allowance that the read path has not caught up to yet. Everything else — a
 * balance genuinely too low, a paused market — must surface immediately rather
 * than sit behind a retry loop.
 */
export function isStaleAllowanceError(error: unknown): boolean {
  return formatErrorMessage(error).toLowerCase().includes("allowance");
}

export function formatErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "shortMessage" in error) {
    const short = (error as { shortMessage?: string }).shortMessage;
    if (short) return short;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
