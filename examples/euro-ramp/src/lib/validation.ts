/**
 * Validation Utilities
 *
 * Zod validation helpers for API request validation.
 */

import { z } from "zod";

export { ZodError } from "zod";

/**
 * Format Zod error into a user-friendly message
 */
export function formatZodError(error: z.ZodError): string {
  const firstError = error.issues[0];
  if (!firstError) return "Validation error";

  const path = firstError.path.join(".");
  return `${path}: ${firstError.message}`;
}

/**
 * Get field-level errors from Zod error
 */
export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const err of error.issues) {
    const path = err.path.join(".");
    if (path) {
      fieldErrors[path] = err.message;
    }
  }

  return fieldErrors;
}
