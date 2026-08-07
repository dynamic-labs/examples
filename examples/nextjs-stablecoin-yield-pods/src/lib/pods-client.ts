import type {
  ApiEnvelope,
  DepositBytecodeRequest,
  DepositBytecodeResponse,
  NormalizedError,
  OperationStage,
  PodsBytecodeCall,
  ValidationResult,
} from "./pods-types";
import {
  MAX_AMOUNT_LENGTH,
  SUPPORTED_CHAIN_IDS,
  isAddress,
  isPlainObject,
  validateBytecodeCall,
} from "./pods-validation";

const DEFAULT_PODS_API_URL = "https://api.pods.finance";
const MAX_DEBUG_CHARS = 4000;
const PODS_REQUEST_TIMEOUT_MS = 30_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_MAX_BUCKETS = 1000;
const RATE_LIMIT_PRUNE_INTERVAL_MS = 60_000;

const STRATEGY_ID_RE = /^[a-zA-Z0-9._:-]{1,128}$/;

type EnvLike = Record<string, string | undefined>;
type ErrorEnvelope = Extract<ApiEnvelope<never>, { ok: false }>;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();
let lastRateLimitPruneAt = 0;

function success<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

function failure<T>(error: string): ValidationResult<T> {
  return { ok: false, error };
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
): string | null {
  return Object.keys(value).find((key) => !allowedKeys.has(key)) ?? null;
}

function validateChainId(value: unknown): ValidationResult<number> {
  const chainId =
    typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : value;
  if (!Number.isInteger(chainId)) return failure("chainId must be an integer");
  if (!SUPPORTED_CHAIN_IDS.has(chainId as number)) {
    return failure(`chainId ${String(chainId)} is not supported by this example`);
  }
  return success(chainId as number);
}

function validateAmount(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") return failure("amount must be a string");
  if (!/^[0-9]+$/.test(value)) {
    return failure("amount must be a positive integer string");
  }
  if (value === "0") return failure("amount must be greater than zero");
  if (value.length > MAX_AMOUNT_LENGTH) {
    return failure("amount is too large for this example");
  }
  return success(value);
}

function validateStrategyId(value: unknown): ValidationResult<string> {
  if (typeof value !== "string" || value.trim() === "") {
    return failure("strategyId is required");
  }
  if (!STRATEGY_ID_RE.test(value)) {
    return failure("strategyId contains unsupported characters");
  }
  return success(value);
}

export function validateDepositRequest(
  input: unknown,
): ValidationResult<DepositBytecodeRequest> {
  if (!isPlainObject(input)) return failure("request body must be an object");

  const unknownKey = hasOnlyKeys(
    input,
    new Set(["strategyId", "chainId", "amount", "asset", "wallet"]),
  );
  if (unknownKey) return failure(`unknown field: ${unknownKey}`);

  const strategyId = validateStrategyId(input.strategyId);
  if (!strategyId.ok) return strategyId;

  const chainId = validateChainId(input.chainId);
  if (!chainId.ok) return chainId;

  const amount = validateAmount(input.amount);
  if (!amount.ok) return amount;

  if (!isAddress(input.asset)) return failure("asset must be an EVM address");
  if (!isAddress(input.wallet)) return failure("wallet must be an EVM address");

  return success({
    strategyId: strategyId.value,
    chainId: chainId.value,
    amount: amount.value,
    asset: input.asset,
    wallet: input.wallet,
  });
}

export function getPodsApiUrl(env: EnvLike = process.env): string {
  return (env.PODS_API_URL ?? DEFAULT_PODS_API_URL).replace(/\/+$/, "");
}

export function buildDepositBytecodeUrl(
  request: DepositBytecodeRequest,
  env: EnvLike = process.env,
): string {
  const url = new URL(
    `/strategies/${encodeURIComponent(request.strategyId)}/bytecode`,
    getPodsApiUrl(env),
  );
  url.searchParams.set("action", "lend");
  url.searchParams.set("chainId", String(request.chainId));
  url.searchParams.set("amount", request.amount);
  url.searchParams.set("asset", request.asset);
  url.searchParams.set("wallet", request.wallet);
  return url.toString();
}

function normalizeApiError(
  stage: OperationStage,
  message: string,
  status?: number,
  details?: unknown,
): ErrorEnvelope {
  return {
    ok: false,
    error: {
      stage,
      message,
      ...(status ? { status } : {}),
      ...(details === undefined ? {} : { details }),
    },
  };
}

export function setupError(message: string): ErrorEnvelope {
  return normalizeApiError("setup", message);
}

export function validationError(message: string): ErrorEnvelope {
  return normalizeApiError("input", message, 400);
}

export function proxyError(
  stage: OperationStage,
  message: string,
  status: number,
  details?: unknown,
): ErrorEnvelope {
  return normalizeApiError(stage, message, status, details);
}

function readCallerRateLimitKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return `ip:${forwarded}`;
  const realIp = headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;
  return "ip:unknown";
}

function readScopedRateLimitKey(scope: string, value: string): string {
  return `${scope}:${value.toLowerCase()}`;
}

export function resetRateLimitsForTests(): void {
  rateLimitBuckets.clear();
  lastRateLimitPruneAt = 0;
}

function pruneExpiredRateLimitBuckets(now: number): void {
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }
  lastRateLimitPruneAt = now;
}

export function checkRateLimit(
  key: string,
  now = Date.now(),
  limit = RATE_LIMIT_MAX,
  windowMs = RATE_LIMIT_WINDOW_MS,
): ValidationResult<void> {
  if (
    rateLimitBuckets.size > RATE_LIMIT_MAX_BUCKETS ||
    now - lastRateLimitPruneAt >= RATE_LIMIT_PRUNE_INTERVAL_MS
  ) {
    pruneExpiredRateLimitBuckets(now);
  }

  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return success(undefined);
  }

  if (current.count >= limit) {
    return failure("rate limit exceeded");
  }

  current.count += 1;
  return success(undefined);
}

export function validateProxyAccess(
  headers: Headers,
  env: EnvLike = process.env,
): ValidationResult<void> {
  const nodeEnv = env.NODE_ENV ?? process.env.NODE_ENV;
  if (nodeEnv === "production" && env.ALLOW_PUBLIC_PODS_PROXY !== "true") {
    return failure(
      "Pods proxy is disabled outside local development. Set ALLOW_PUBLIC_PODS_PROXY=true only for intentional public testing.",
    );
  }

  const origin = headers.get("origin");
  const host = headers.get("host");
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return failure("cross-origin requests are not allowed");
      }
    } catch {
      return failure("invalid Origin header");
    }
  }

  const rateLimit = checkRateLimit(readCallerRateLimitKey(headers));
  if (!rateLimit.ok) return rateLimit;

  return success(undefined);
}

export function validateScopedProxyAccess(
  scope: "wallet",
  value: string,
): ValidationResult<void> {
  const rateLimit = checkRateLimit(readScopedRateLimitKey(scope, value));
  if (!rateLimit.ok) return rateLimit;

  return success(undefined);
}

function shouldRedactKey(key: string): boolean {
  return /api[-_]?key|authorization|cookie|signature|paymaster|private/i.test(
    key,
  );
}

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((nested) => redactValue(nested, depth + 1));
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    const limitedEntries = entries.slice(0, 50).map(([key, nested]) => [
      key,
      shouldRedactKey(key) ? "[redacted]" : redactValue(nested, depth + 1),
    ]);
    if (entries.length > limitedEntries.length) {
      limitedEntries.push([
        "__truncatedKeys",
        entries.length - limitedEntries.length,
      ]);
    }
    return Object.fromEntries(limitedEntries);
  }
  if (typeof value === "string" && value.length > MAX_DEBUG_CHARS) {
    return `${value.slice(0, MAX_DEBUG_CHARS)}...[truncated]`;
  }
  return value;
}

export function redactForClient(value: unknown, allowRaw = false): unknown {
  if (allowRaw) return value;
  const redacted = redactValue(value);
  const serialized = JSON.stringify(redacted);
  if (serialized.length <= MAX_DEBUG_CHARS) return redacted;
  return {
    truncated: true,
    value: serialized.slice(0, MAX_DEBUG_CHARS),
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function readPodsRequestTimeoutMs(env: EnvLike): number {
  const configured = Number(env.PODS_API_TIMEOUT_MS);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return PODS_REQUEST_TIMEOUT_MS;
}

function createTimeoutSignal(env: EnvLike): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined" || !("timeout" in AbortSignal)) {
    return undefined;
  }
  return AbortSignal.timeout(readPodsRequestTimeoutMs(env));
}

function readErrorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  if (isPlainObject(error) && typeof error.name === "string") return error.name;
  return "";
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (isPlainObject(error) && typeof error.message === "string") {
    return error.message;
  }
  return String(error);
}

function isTimeoutLikeError(error: unknown): boolean {
  const name = readErrorName(error);
  return name === "AbortError" || name === "TimeoutError";
}

function buildTransportError(
  stage: OperationStage,
  error: unknown,
  allowRaw: boolean,
): ErrorEnvelope {
  const timedOut = isTimeoutLikeError(error);
  const details = {
    name: readErrorName(error) || "Error",
    message: readErrorMessage(error),
  };

  return proxyError(
    stage,
    timedOut
      ? "Timed out while requesting Pods bytecode."
      : "Network error while requesting Pods bytecode.",
    timedOut ? 504 : 502,
    redactForClient(details, allowRaw),
  );
}

async function fetchPodsResponse(
  input: string,
  init: RequestInit,
  env: EnvLike,
  fetchImpl: typeof fetch,
): Promise<ApiEnvelope<{ response: Response; body: unknown }>> {
  try {
    const response = await fetchImpl(input, {
      ...init,
      signal: createTimeoutSignal(env),
      cache: "no-store",
    });
    const body = await parseResponseBody(response);
    return { ok: true, data: { response, body } };
  } catch (error) {
    return buildTransportError(
      "request",
      error,
      env.PODS_DEBUG_RAW_RESPONSE === "true",
    );
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (isPlainObject(body)) {
    const error = body.error;
    if (isPlainObject(error) && typeof error.message === "string") {
      return error.message;
    }
    if (typeof error === "string") return error;
    if (typeof body.message === "string") return body.message;
  }
  if (typeof body === "string" && body.trim()) return body;
  return fallback;
}

function requireApiKey(env: EnvLike): ValidationResult<string> {
  const apiKey = env.PODS_API_KEY;
  if (!apiKey) return failure("PODS_API_KEY is not set");
  return success(apiKey);
}

export async function getDepositBytecode(
  request: DepositBytecodeRequest,
  options: {
    env?: EnvLike;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<ApiEnvelope<DepositBytecodeResponse>> {
  const env = options.env ?? process.env;
  const apiKey = requireApiKey(env);
  if (!apiKey.ok) return setupError(apiKey.error);

  const fetchImpl = options.fetchImpl ?? fetch;
  const requestUrl = buildDepositBytecodeUrl(request, env);
  const podsResponse = await fetchPodsResponse(
    requestUrl,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey.value,
      },
    },
    env,
    fetchImpl,
  );
  if (!podsResponse.ok) return podsResponse;

  const { response, body } = podsResponse.data;
  const allowRaw = env.PODS_DEBUG_RAW_RESPONSE === "true";
  if (!response.ok) {
    return proxyError(
      "request",
      extractErrorMessage(body, "Pods bytecode request failed"),
      response.status,
      redactForClient({ requestUrl, response: body }, allowRaw),
    );
  }

  const normalized = normalizeDepositBytecodeResponse(body, requestUrl);
  if (!normalized.ok) {
    return proxyError(
      "request",
      normalized.error,
      502,
      redactForClient({ requestUrl, response: body }, allowRaw),
    );
  }
  return { ok: true, data: normalized.value };
}

function readBytecodeArray(body: Record<string, unknown>): unknown[] | null {
  if (Array.isArray(body.bytecode)) return body.bytecode;
  if (isPlainObject(body.data) && Array.isArray(body.data.bytecode)) {
    return body.data.bytecode;
  }
  return null;
}

function normalizeDepositBytecodeResponse(
  body: unknown,
  requestUrl: string,
): ValidationResult<DepositBytecodeResponse> {
  if (!isPlainObject(body)) return failure("Pods response must be an object");

  const rawBytecode = readBytecodeArray(body);
  if (!rawBytecode) return failure("Pods response is missing bytecode[]");
  if (rawBytecode.length === 0) return failure("Pods returned empty bytecode[]");

  const bytecode: PodsBytecodeCall[] = [];
  for (const [index, call] of rawBytecode.entries()) {
    const validated = validateBytecodeCall(call, index);
    if (!validated.ok) return validated;
    bytecode.push(validated.value);
  }

  const id =
    typeof body.id === "string"
      ? body.id
      : typeof body.actionId === "string"
        ? body.actionId
        : isPlainObject(body.data) && typeof body.data.id === "string"
          ? body.data.id
          : undefined;

  const chainId =
    typeof body.chainId === "number" || typeof body.chainId === "string"
      ? body.chainId
      : isPlainObject(body.data) &&
          (typeof body.data.chainId === "number" ||
            typeof body.data.chainId === "string")
        ? body.data.chainId
        : undefined;

  return success({
    ...(id ? { id } : {}),
    ...(chainId === undefined ? {} : { chainId }),
    bytecode,
    requestUrl,
    raw: redactForClient(body),
  });
}

export function toHttpStatus(error: NormalizedError): number {
  if (error.stage === "setup") return 500;
  if (error.stage === "input") return 400;
  return error.status ?? 502;
}
