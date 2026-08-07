import {
  jsonEnvelopeResponse,
  methodNotAllowed,
  proxyAccessStatus,
} from "../route-helpers";
import {
  getDepositBytecode,
  validateDepositRequest,
  validateProxyAccess,
  validateScopedProxyAccess,
  proxyError,
  validationError,
} from "@/lib/pods-client";
import type { DepositBytecodeRequest } from "@/lib/pods-types";

function createRequestId(): string {
  return globalThis.crypto?.randomUUID?.().slice(0, 8) ??
    Math.random().toString(16).slice(2, 10);
}

function logInfo(
  requestId: string,
  message: string,
  details: Record<string, unknown> = {},
): void {
  console.info("[pods-bytecode]", message, {
    requestId,
    ...details,
  });
}

function logError(
  requestId: string,
  message: string,
  details: Record<string, unknown> = {},
): void {
  console.error("[pods-bytecode]", message, {
    requestId,
    ...details,
  });
}

function summarizeRequest(request: DepositBytecodeRequest) {
  return {
    strategyId: request.strategyId,
    chainId: request.chainId,
    amount: request.amount,
    asset: request.asset,
    wallet: request.wallet,
  };
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const startedAt = Date.now();
  logInfo(requestId, "received local bytecode proxy request");

  const access = validateProxyAccess(request.headers);
  if (!access.ok) {
    logError(requestId, "proxy access rejected", {
      reason: access.error,
      durationMs: Date.now() - startedAt,
    });
    return jsonEnvelopeResponse(
      validationError(access.error),
      proxyAccessStatus(access.error),
    );
  }

  const body = await request.json().catch(() => null);
  const validated = validateDepositRequest(body);
  if (!validated.ok) {
    logError(requestId, "request validation failed", {
      reason: validated.error,
      durationMs: Date.now() - startedAt,
    });
    return jsonEnvelopeResponse(validationError(validated.error));
  }

  const scopedAccess = validateScopedProxyAccess("wallet", validated.value.wallet);
  if (!scopedAccess.ok) {
    logError(requestId, "wallet scoped proxy access rejected", {
      reason: scopedAccess.error,
      wallet: validated.value.wallet,
      durationMs: Date.now() - startedAt,
    });
    return jsonEnvelopeResponse(
      validationError(scopedAccess.error),
      proxyAccessStatus(scopedAccess.error),
    );
  }

  logInfo(requestId, "requesting Pods bytecode", summarizeRequest(validated.value));
  const envelope = await getDepositBytecode(validated.value).catch((error) => {
    logError(requestId, "unexpected bytecode proxy failure", {
      error: readErrorMessage(error),
      durationMs: Date.now() - startedAt,
    });
    return proxyError(
      "request",
      "Unexpected server error while requesting Pods bytecode.",
      500,
      { requestId, message: readErrorMessage(error) },
    );
  });

  if (envelope.ok) {
    logInfo(requestId, "Pods bytecode request succeeded", {
      actionId: envelope.data.id,
      chainId: envelope.data.chainId,
      callCount: envelope.data.bytecode.length,
      requestUrl: envelope.data.requestUrl,
      durationMs: Date.now() - startedAt,
    });
  } else {
    logError(requestId, "Pods bytecode request failed", {
      stage: envelope.error.stage,
      status: envelope.error.status,
      message: envelope.error.message,
      durationMs: Date.now() - startedAt,
    });
  }

  return jsonEnvelopeResponse(envelope);
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
