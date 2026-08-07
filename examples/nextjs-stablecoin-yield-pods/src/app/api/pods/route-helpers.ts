import { NextResponse } from "next/server";
import {
  toHttpStatus,
  validationError,
} from "@/lib/pods-client";
import type { ApiEnvelope } from "@/lib/pods-types";

export function jsonEnvelopeResponse<T>(
  envelope: ApiEnvelope<T>,
  status = envelope.ok ? 200 : toHttpStatus(envelope.error),
) {
  return NextResponse.json(envelope, { status });
}

export function methodNotAllowed() {
  return jsonEnvelopeResponse(validationError("method not allowed"), 405);
}

export function proxyAccessStatus(error: string): number {
  return error.includes("rate limit") ? 429 : 403;
}
