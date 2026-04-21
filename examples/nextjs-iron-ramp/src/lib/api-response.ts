/**
 * API Response Utilities
 *
 * Standardized response handling for API routes.
 * Provides consistent error handling and response formatting.
 */

import { NextResponse } from "next/server";
import { addCorsHeaders } from "./cors";
import { AppError } from "./errors";
import { ZodError, formatZodError, getFieldErrors } from "./validation";

/**
 * Create a successful JSON response with CORS headers
 *
 * Standardizes all API responses to { success: true, data: T } format.
 * CORS headers are automatically added for cross-origin support.
 */
export function createResponse<T>(
  data: T,
  status: number = 200,
  _request?: Request
): NextResponse {
  return addCorsHeaders(
    NextResponse.json({ success: true, data }, { status })
  );
}

/**
 * Create an error response with CORS headers
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  code?: string,
  _request?: Request
): NextResponse {
  return addCorsHeaders(
    NextResponse.json({ error: message, ...(code && { code }) }, { status })
  );
}

/**
 * Handle errors and return appropriate response
 * Maps AppError subclasses and ZodError to appropriate HTTP responses
 */
export function handleApiError(
  error: unknown,
  context?: string,
  _request?: Request
): NextResponse {
  // Log error with context
  if (context) console.error(`[${context}]`, error);
  else console.error(error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return addCorsHeaders(
      NextResponse.json(
        {
          error: formatZodError(error),
          code: "VALIDATION_ERROR",
          details: getFieldErrors(error),
        },
        { status: 400 }
      )
    );
  }

  // Handle known application errors
  if (error instanceof AppError) {
    return createErrorResponse(
      error.message,
      error.statusCode,
      error.code
    );
  }

  // Handle unknown errors
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return createErrorResponse(message, 500);
}

