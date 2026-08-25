"use client";

import { useCallback, useMemo, useState } from "react";
import {
  isEthereumWallet,
  isZeroDevConnector,
  useDynamicContext,
  useSmartWallets,
} from "@/lib/dynamic";
import { hasDynamicEnvironment } from "@/lib/providers";
import {
  isAddress,
  isPositiveRawAmount,
} from "@/lib/pods-validation";
import {
  bytecodeToBatchCalls,
  readTransactionHash,
} from "@/lib/zerodev-batch";
import {
  isUserOperationReceiptPendingError,
  normalizeErrorMessage,
  normalizeZeroDevBatchError,
  sanitizeExternalErrorMessage,
} from "@/lib/zerodev-errors";
import type {
  ApiEnvelope,
  BatchCall,
  BatchSubmissionResponse,
  DepositBytecodeResponse,
  DepositStage,
  Hex,
  NormalizedError,
  OperationStage,
  UserOperationInclusionResponse,
} from "./pods-types";

export interface DepositFormValues {
  strategyId: string;
  chainId: string;
  asset: string;
  amount: string;
}

interface OperationState {
  stage: DepositStage;
  busy: boolean;
  error: NormalizedError | null;
  bytecode: DepositBytecodeResponse | null;
  calls: BatchCall[];
  submitted: BatchSubmissionResponse | null;
  logs: OperationLogEntry[];
}

export interface OperationLogEntry {
  at: string;
  message: string;
  details?: string;
}

interface KernelBatchClient {
  account?: {
    address?: Hex;
    encodeCalls?: (calls: BatchCall[]) => Promise<Hex>;
  };
  sendTransaction?: (args: { calls: BatchCall[] }) => Promise<Hex>;
  sendUserOperation?: (args: { calls: BatchCall[] }) => Promise<Hex>;
  getUserOperationReceipt?: (args: { hash: Hex }) => Promise<unknown>;
  waitForUserOperationReceipt?: (args: {
    hash: Hex;
    pollingInterval?: number;
    retryCount?: number;
    timeout?: number;
  }) => Promise<unknown>;
}

interface ZeroDevConnectorLike {
  providersFromApi?: Array<{
    chain?: number | string;
    clientId?: string;
  }>;
  getAccountAbstractionProvider?: (options?: {
    withSponsorship?: boolean;
  }) => unknown;
  getConnectedAccounts?: () => Promise<string[]>;
  getNetwork?: () => Promise<number | undefined>;
  switchNetwork?: (options: { networkChainId: number | string }) => Promise<void>;
}

interface KernelClientResolution {
  kernelClient: KernelBatchClient;
  withSponsorship: boolean;
}

const INITIAL_STATE: OperationState = {
  stage: "setup",
  busy: false,
  error: null,
  bytecode: null,
  calls: [],
  submitted: null,
  logs: [],
};

const KERNEL_CLIENT_READY_TIMEOUT_MS = 15_000;
const KERNEL_CLIENT_READY_POLL_MS = 250;
const KERNEL_CLIENT_INIT_AWAIT_TIMEOUT_MS = 2_000;
const ZERO_DEV_SUBMIT_TIMEOUT_MS = 120_000;
const ZERO_DEV_RECEIPT_TIMEOUT_MS = 180_000;
const ZERO_DEV_RECEIPT_POLL_MS = 5_000;
const ZERO_DEV_RECEIPT_ATTEMPT_TIMEOUT_MS = 15_000;
const ZERO_DEV_RECEIPT_PROGRESS_LOG_MS = 15_000;

export const DEFAULT_FORM_VALUES: DepositFormValues = {
  strategyId: "Morpho-hyperUSDCa-monad",
  chainId: "143",
  asset: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
  amount: "1000000",
};

function inputError(message: string): NormalizedError {
  return { stage: "input", message };
}

function batchError(error: unknown, chainId?: number): NormalizedError {
  return normalizeZeroDevBatchError(error, chainId);
}

function transportError(stage: OperationStage, error: unknown): NormalizedError {
  return {
    stage,
    message: error instanceof Error ? error.message : String(error),
  };
}

function validateFormValues(values: DepositFormValues): {
  ok: true;
  chainId: number;
  asset: Hex;
} | {
  ok: false;
  error: NormalizedError;
} {
  if (!values.strategyId.trim()) {
    return { ok: false, error: inputError("Strategy id is required.") };
  }
  const chainId = Number(values.chainId);
  if (!Number.isInteger(chainId)) {
    return { ok: false, error: inputError("Chain id must be an integer.") };
  }
  if (!isAddress(values.asset)) {
    return { ok: false, error: inputError("Asset must be an EVM address.") };
  }
  if (!isPositiveRawAmount(values.amount)) {
    return {
      ok: false,
      error: inputError("Amount must be a positive raw integer string."),
    };
  }
  return {
    ok: true,
    chainId,
    asset: values.asset,
  };
}

async function readEnvelope<T>(
  response: Response,
  fallbackStage: OperationStage,
): Promise<ApiEnvelope<T>> {
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (body && typeof body === "object" && "ok" in body) return body;
  return {
    ok: false,
    error: {
      stage: fallbackStage,
      message: `Unexpected response (${response.status})`,
      status: response.status,
    },
  };
}

function getConnectorName(connector: unknown): string {
  if (!connector || typeof connector !== "object") return "Not available";
  const record = connector as Record<string, unknown>;
  return (
    (typeof record.name === "string" && record.name) ||
    (typeof record.key === "string" && record.key) ||
    "Connected"
  );
}

function stringifyLogDetails(details: unknown): string | undefined {
  if (details === undefined) return undefined;
  if (typeof details === "string") return details;

  try {
    return JSON.stringify(
      details,
      (_key, value: unknown) =>
        typeof value === "bigint" ? value.toString() : value,
      2,
    );
  } catch {
    return String(details);
  }
}

function createLogEntry(
  message: string,
  details?: unknown,
): OperationLogEntry {
  return {
    at: new Date().toLocaleTimeString(),
    message,
    details: stringifyLogDetails(details),
  };
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs / 1000}s.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function readKernelClient(
  connector: ZeroDevConnectorLike,
  withSponsorship: boolean,
): KernelBatchClient | undefined {
  const provider = connector.getAccountAbstractionProvider?.({ withSponsorship });
  if (!provider || typeof provider !== "object") return undefined;

  const kernelClient = provider as Partial<KernelBatchClient>;
  const canSendTransaction = typeof kernelClient.sendTransaction === "function";
  const canSendUserOperation = typeof kernelClient.sendUserOperation === "function";

  return canSendTransaction || canSendUserOperation
    ? (kernelClient as KernelBatchClient)
    : undefined;
}

function readConnectorDiagnostics(connector: ZeroDevConnectorLike) {
  const record = connector as Record<string, unknown>;
  const providerMap = record.providerMap;

  return {
    bundlerProvider:
      typeof record.bundlerProvider === "string"
        ? record.bundlerProvider
        : undefined,
    bundlerRpc:
      typeof record.bundlerRpc === "string" ? record.bundlerRpc : undefined,
    defaultChainId:
      typeof record.defaultChainId === "string" ? record.defaultChainId : undefined,
    eoaAddress:
      typeof record.eoaAddress === "string" ? record.eoaAddress : undefined,
    hasEoaConnector: Boolean(record.eoaConnector),
    hasKernelClient: Boolean(record.kernelClient),
    hasKernelClientWithSponsorship: Boolean(record.kernelClientWithSponsorship),
    lastUsedChainId:
      typeof record.lastUsedChainId === "string" ? record.lastUsedChainId : undefined,
    providerMapChains:
      providerMap && typeof providerMap === "object"
        ? Object.keys(providerMap)
        : [],
    paymasterRpc:
      typeof record.paymasterRpc === "string" ? record.paymasterRpc : undefined,
    providersFromApi: connector.providersFromApi?.map((provider) => ({
      chain: provider.chain,
      clientId: provider.clientId,
    })) ?? [],
  };
}

function assertZeroDevConfiguredForChain(
  connector: ZeroDevConnectorLike,
  chainId: number,
): void {
  const providers = connector.providersFromApi;
  if (!providers?.length) return;

  if (!providers.some((provider) => String(provider.chain) === String(chainId))) {
    throw new Error(
      `ZeroDev is not configured for chain ${chainId}. Add a ZeroDev project for Monad 143 in Dynamic Sponsor Gas.`,
    );
  }
}

async function switchZeroDevNetwork(
  connector: ZeroDevConnectorLike,
  chainId: number,
): Promise<void> {
  if (!connector.switchNetwork) return;
  await connector.switchNetwork({ networkChainId: chainId });
}

async function getKernelClient(
  connector: unknown,
  log?: (message: string, details?: unknown) => void,
): Promise<KernelClientResolution> {
  if (!connector || typeof connector !== "object") {
    throw new Error("ZeroDev connector is not available.");
  }
  const zeroDevConnector = connector as ZeroDevConnectorLike;
  const deadline = Date.now() + KERNEL_CLIENT_READY_TIMEOUT_MS;
  const startedAt = Date.now();
  let attempts = 0;
  let nextProgressLogAt = startedAt;
  let lastError: unknown;

  while (Date.now() < deadline) {
    attempts += 1;
    const sponsoredKernelClient = readKernelClient(zeroDevConnector, true);
    if (sponsoredKernelClient) {
      log?.("ZeroDev kernel client is ready", {
        attempts,
        account: sponsoredKernelClient.account?.address,
        method: sponsoredKernelClient.sendTransaction
          ? "sendTransaction"
          : "sendUserOperation",
        withSponsorship: true,
      });
      return {
        kernelClient: sponsoredKernelClient,
        withSponsorship: true,
      };
    }

    const unsponsoredKernelClient = readKernelClient(zeroDevConnector, false);
    if (unsponsoredKernelClient) {
      log?.("ZeroDev kernel client is ready", {
        attempts,
        account: unsponsoredKernelClient.account?.address,
        method: unsponsoredKernelClient.sendTransaction
          ? "sendTransaction"
          : "sendUserOperation",
        withSponsorship: false,
      });
      return {
        kernelClient: unsponsoredKernelClient,
        withSponsorship: false,
      };
    }

    try {
      const [network, accounts] = await Promise.all([
        zeroDevConnector.getNetwork
          ? withTimeout(
              zeroDevConnector.getNetwork(),
              KERNEL_CLIENT_INIT_AWAIT_TIMEOUT_MS,
              "ZeroDev network lookup",
            )
          : Promise.resolve(undefined),
        zeroDevConnector.getConnectedAccounts
          ? withTimeout(
              zeroDevConnector.getConnectedAccounts(),
              KERNEL_CLIENT_INIT_AWAIT_TIMEOUT_MS,
              "ZeroDev account lookup",
            )
          : Promise.resolve([]),
      ]);
      if (Date.now() >= nextProgressLogAt) {
        log?.("Waiting for ZeroDev kernel client", {
          attempts,
          elapsedMs: Date.now() - startedAt,
          connectedAccounts: accounts ?? [],
          network,
          ...readConnectorDiagnostics(zeroDevConnector),
        });
        nextProgressLogAt = Date.now() + 2_000;
      }
    } catch (error) {
      lastError = error;
      if (Date.now() >= nextProgressLogAt) {
        log?.("ZeroDev initialization is not ready yet", {
          attempts,
          elapsedMs: Date.now() - startedAt,
          error: normalizeErrorMessage(error),
          ...readConnectorDiagnostics(zeroDevConnector),
        });
        nextProgressLogAt = Date.now() + 2_000;
      }
    }

    const initializedSponsoredKernelClient = readKernelClient(
      zeroDevConnector,
      true,
    );
    if (initializedSponsoredKernelClient) {
      log?.("ZeroDev kernel client is ready after account lookup", {
        attempts,
        account: initializedSponsoredKernelClient.account?.address,
        method: initializedSponsoredKernelClient.sendTransaction
          ? "sendTransaction"
          : "sendUserOperation",
        withSponsorship: true,
      });
      return {
        kernelClient: initializedSponsoredKernelClient,
        withSponsorship: true,
      };
    }

    const initializedUnsponsoredKernelClient = readKernelClient(
      zeroDevConnector,
      false,
    );
    if (initializedUnsponsoredKernelClient) {
      log?.("ZeroDev kernel client is ready after account lookup", {
        attempts,
        account: initializedUnsponsoredKernelClient.account?.address,
        method: initializedUnsponsoredKernelClient.sendTransaction
          ? "sendTransaction"
          : "sendUserOperation",
        withSponsorship: false,
      });
      return {
        kernelClient: initializedUnsponsoredKernelClient,
        withSponsorship: false,
      };
    }

    await sleep(KERNEL_CLIENT_READY_POLL_MS);
  }

  if (lastError instanceof Error) {
    throw new Error(`ZeroDev kernel client is not ready: ${lastError.message}`);
  }
  throw new Error("ZeroDev kernel client is not ready yet. Wait a moment and retry.");
}

async function submitBatchedCalls(
  kernelClient: KernelBatchClient,
  calls: BatchCall[],
): Promise<Hex> {
  if (kernelClient.sendUserOperation) {
    return kernelClient.sendUserOperation({ calls });
  }

  if (kernelClient.sendTransaction) {
    return kernelClient.sendTransaction({ calls });
  }

  throw new Error("ZeroDev kernel client cannot send batched calls.");
}

function readSubmitMethod(kernelClient: KernelBatchClient): string {
  if (kernelClient.sendUserOperation) return "sendUserOperation(calls)";
  if (kernelClient.sendTransaction) return "sendTransaction(calls)";
  return "not available";
}

function hexByteLength(value: Hex): number {
  return Math.max(0, (value.length - 2) / 2);
}

async function buildBatchPreflight(
  kernelClient: KernelBatchClient,
  calls: BatchCall[],
  withSponsorship: boolean,
) {
  const preflight: Record<string, unknown> = {
    callCount: calls.length,
    hasGetUserOperationReceipt: Boolean(kernelClient.getUserOperationReceipt),
    hasWaitForUserOperationReceipt: Boolean(
      kernelClient.waitForUserOperationReceipt,
    ),
    sender: kernelClient.account?.address,
    submitMethod: readSubmitMethod(kernelClient),
    withSponsorship,
  };

  if (!kernelClient.account?.encodeCalls) {
    return {
      ...preflight,
      encodedCallDataBytes: "encodeCalls not available",
    };
  }

  try {
    const encodedCallData = await kernelClient.account.encodeCalls(calls);
    return {
      ...preflight,
      encodedCallDataBytes: hexByteLength(encodedCallData),
    };
  } catch (error) {
    return {
      ...preflight,
      encodedCallDataError: normalizeErrorMessage(error),
    };
  }
}

async function checkMonadInclusion(
  request: {
    asset: Hex;
    sender: Hex;
    userOperationHash: Hex;
  },
): Promise<ApiEnvelope<UserOperationInclusionResponse>> {
  const response = await fetch("/api/monad/user-operation-inclusion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return readEnvelope<UserOperationInclusionResponse>(response, "submitted");
}

async function readReceiptOnce(
  kernelClient: KernelBatchClient,
  hash: Hex,
): Promise<unknown> {
  if (kernelClient.getUserOperationReceipt) {
    return withTimeout(
      kernelClient.getUserOperationReceipt({ hash }),
      ZERO_DEV_RECEIPT_ATTEMPT_TIMEOUT_MS,
      "ZeroDev receipt poll",
    );
  }

  if (kernelClient.waitForUserOperationReceipt) {
    return withTimeout(
      kernelClient.waitForUserOperationReceipt({
        hash,
        pollingInterval: ZERO_DEV_RECEIPT_POLL_MS,
        retryCount: 1,
        timeout: ZERO_DEV_RECEIPT_ATTEMPT_TIMEOUT_MS,
      }),
      ZERO_DEV_RECEIPT_ATTEMPT_TIMEOUT_MS + 1_000,
      "ZeroDev receipt poll",
    );
  }

  throw new Error("ZeroDev client has no receipt reader.");
}

async function waitForZeroDevReceipt(
  kernelClient: KernelBatchClient,
  hash: Hex,
  log: (message: string, details?: unknown) => void,
): Promise<unknown | undefined> {
  const startedAt = Date.now();
  const deadline = startedAt + ZERO_DEV_RECEIPT_TIMEOUT_MS;
  let attempts = 0;
  let nextProgressLogAt = startedAt;
  let lastError: unknown;

  while (Date.now() < deadline) {
    attempts += 1;
    try {
      return await readReceiptOnce(kernelClient, hash);
    } catch (error) {
      lastError = error;
      if (!isUserOperationReceiptPendingError(error)) {
        throw error;
      }

      if (Date.now() >= nextProgressLogAt) {
        log("ZeroDev receipt is not indexed yet", {
          attempts,
          elapsedMs: Date.now() - startedAt,
          userOperationHash: hash,
          error: sanitizeExternalErrorMessage(error),
        });
        nextProgressLogAt = Date.now() + ZERO_DEV_RECEIPT_PROGRESS_LOG_MS;
      }
    }

    await sleep(ZERO_DEV_RECEIPT_POLL_MS);
  }

  log("ZeroDev receipt was still unavailable after polling", {
    attempts,
    elapsedMs: Date.now() - startedAt,
    userOperationHash: hash,
    lastError: lastError
      ? sanitizeExternalErrorMessage(lastError)
      : "No receipt returned.",
  });
  return undefined;
}

export function useZeroDevBatchedDeposit() {
  const { primaryWallet } = useDynamicContext();
  const { getSmartWallet } = useSmartWallets();
  const [state, setState] = useState<OperationState>(INITIAL_STATE);

  const linkedSmartWallet = primaryWallet
    ? getSmartWallet(primaryWallet)
    : undefined;
  const walletForDeposit = linkedSmartWallet ?? primaryWallet;
  const evmDepositWallet =
    walletForDeposit && isEthereumWallet(walletForDeposit)
      ? walletForDeposit
      : null;
  const evmPrimaryWallet =
    primaryWallet && isEthereumWallet(primaryWallet) ? primaryWallet : null;
  const smartWalletAddress = evmDepositWallet?.address as Hex | undefined;
  const connector = evmDepositWallet?.connector;
  const connectorName = getConnectorName(connector);
  const isZeroDevWallet = Boolean(connector && isZeroDevConnector(connector));
  const canSubmit =
    hasDynamicEnvironment &&
    Boolean(primaryWallet && smartWalletAddress && isZeroDevWallet);
  const disabledReason = useMemo(() => {
    if (!hasDynamicEnvironment) {
      return "NEXT_PUBLIC_DYNAMIC_ENV_ID is not set.";
    }
    if (!primaryWallet) {
      return "Connect a Dynamic ZeroDev smart wallet.";
    }
    if (!evmPrimaryWallet) {
      return "The connected wallet is not EVM-compatible.";
    }
    if (!isZeroDevWallet) {
      return `Connected connector is ${connectorName}. Dynamic has not exposed a linked ZeroDev smart wallet for this session yet.`;
    }
    return undefined;
  }, [connectorName, evmPrimaryWallet, isZeroDevWallet, primaryWallet]);

  const summary = useMemo(
    () => ({
      smartWalletAddress,
      connectorName,
      actionId: state.bytecode?.id,
      callCount: state.calls.length,
      requestUrl: state.bytecode?.requestUrl,
      submittedHash: state.submitted?.submittedHash,
      transactionHash: state.submitted?.transactionHash,
      inclusion: state.submitted?.inclusion,
    }),
    [
      connectorName,
      smartWalletAddress,
      state.bytecode?.id,
      state.bytecode?.requestUrl,
      state.calls.length,
      state.submitted?.inclusion,
      state.submitted?.submittedHash,
      state.submitted?.transactionHash,
    ],
  );

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const startDeposit = useCallback(
    async (values: DepositFormValues) => {
      let logs: OperationLogEntry[] = [];
      const pushLog = (message: string, details?: unknown) => {
        const entry = createLogEntry(message, details);
        logs = [...logs, entry];
        console.info("[pods-zerodev]", message, details ?? "");
        setState((current) => ({
          ...current,
          logs,
        }));
      };
      const stateWithLogs = (
        partial: Partial<OperationState>,
      ): OperationState => ({
        ...INITIAL_STATE,
        logs,
        ...partial,
      });

      pushLog("Start batched deposit clicked", {
        chainId: values.chainId,
        strategyId: values.strategyId,
        asset: values.asset,
        amount: values.amount,
        primaryWallet: evmPrimaryWallet?.address,
        depositWallet: evmDepositWallet?.address,
        connector: connectorName,
        zeroDevSelected: isZeroDevWallet,
      });

      if (!hasDynamicEnvironment) {
        setState(stateWithLogs({
          stage: "setup",
          error: inputError("NEXT_PUBLIC_DYNAMIC_ENV_ID is not set."),
        }));
        return;
      }
      if (!evmPrimaryWallet) {
        setState(stateWithLogs({
          stage: "input",
          error: inputError("Connect an EVM wallet in Dynamic."),
        }));
        return;
      }
      if (!isZeroDevWallet) {
        setState(stateWithLogs({
          stage: "input",
          error: inputError("Dynamic has not exposed a linked ZeroDev smart wallet."),
        }));
        return;
      }
      if (!evmDepositWallet) {
        setState(stateWithLogs({
          stage: "input",
          error: inputError("ZeroDev smart wallet is not EVM-compatible."),
        }));
        return;
      }

      pushLog("Validating deposit input");
      const validated = validateFormValues(values);
      if (!validated.ok) {
        pushLog("Deposit input validation failed", validated.error.message);
        setState(stateWithLogs({
          stage: "input",
          error: validated.error,
        }));
        return;
      }

      setState(stateWithLogs({
        busy: true,
        stage: "request",
      }));

      let envelope: ApiEnvelope<DepositBytecodeResponse>;
      try {
        pushLog("Requesting Pods bytecode", {
          endpoint: "/api/pods/deposit-bytecode",
          wallet: evmDepositWallet.address,
          chainId: validated.chainId,
        });
        const response = await fetch("/api/pods/deposit-bytecode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategyId: values.strategyId,
            chainId: validated.chainId,
            amount: values.amount,
            asset: validated.asset,
            wallet: evmDepositWallet.address,
          }),
        });
        envelope = await readEnvelope<DepositBytecodeResponse>(
          response,
          "request",
        );
        pushLog("Pods bytecode response received", {
          ok: envelope.ok,
          status: response.status,
        });
      } catch (error) {
        pushLog("Pods bytecode request failed", normalizeErrorMessage(error));
        setState(stateWithLogs({
          busy: false,
          stage: "request",
          error: transportError("request", error),
        }));
        return;
      }

      if (!envelope.ok) {
        pushLog("Pods bytecode response was not ok", envelope.error);
        setState(stateWithLogs({
          busy: false,
          stage: envelope.error.stage,
          error: envelope.error,
        }));
        return;
      }

      pushLog("Pods bytecode ready", {
        actionId: envelope.data.id,
        calls: envelope.data.bytecode.length,
      });

      let calls: BatchCall[];
      try {
        pushLog("Converting Pods bytecode into ZeroDev batch calls");
        calls = bytecodeToBatchCalls(envelope.data.bytecode);
        pushLog("ZeroDev batch calls prepared", {
          calls: calls.map((call, index) => ({
            index: index + 1,
            to: call.to,
            value: call.value.toString(),
            dataBytes: Math.max(0, (call.data.length - 2) / 2),
          })),
        });
      } catch (error) {
        pushLog("Bytecode conversion failed", normalizeErrorMessage(error));
        setState(stateWithLogs({
          busy: false,
          stage: "batch",
          bytecode: envelope.data,
          error: batchError(error, validated.chainId),
        }));
        return;
      }

      setState(stateWithLogs({
        busy: true,
        stage: "batch",
        bytecode: envelope.data,
        calls,
      }));

      try {
        const zeroDevConnector =
          evmDepositWallet.connector as ZeroDevConnectorLike;
        pushLog(
          "ZeroDev connector diagnostics",
          readConnectorDiagnostics(zeroDevConnector),
        );
        pushLog("Checking ZeroDev chain configuration", {
          chainId: validated.chainId,
        });
        assertZeroDevConfiguredForChain(zeroDevConnector, validated.chainId);
        pushLog("ZeroDev chain configuration is available");
        pushLog("Switching ZeroDev network", { chainId: validated.chainId });
        await switchZeroDevNetwork(zeroDevConnector, validated.chainId);
        pushLog("ZeroDev network switch completed");
        pushLog("Resolving ZeroDev kernel client");
        const { kernelClient, withSponsorship } = await getKernelClient(
          zeroDevConnector,
          pushLog,
        );
        pushLog(
          "ZeroDev batch preflight",
          await buildBatchPreflight(kernelClient, calls, withSponsorship),
        );
        pushLog("Submitting ZeroDev batch", {
          callCount: calls.length,
          method: readSubmitMethod(kernelClient),
          withSponsorship,
        });
        const submittedHash = await withTimeout(
          submitBatchedCalls(kernelClient, calls),
          ZERO_DEV_SUBMIT_TIMEOUT_MS,
          "ZeroDev batch submission",
        );
        pushLog("ZeroDev batch submitted", { submittedHash });
        setState(stateWithLogs({
          busy: true,
          stage: "submitted",
          bytecode: envelope.data,
          calls,
          submitted: { submittedHash },
        }));
        let transactionHash: Hex | undefined;
        if (
          kernelClient.getUserOperationReceipt ||
          kernelClient.waitForUserOperationReceipt
        ) {
          try {
            pushLog("Waiting for ZeroDev user operation receipt", {
              submittedHash,
            });
            const receipt = await waitForZeroDevReceipt(
              kernelClient,
              submittedHash,
              pushLog,
            );
            transactionHash = readTransactionHash(receipt);
            if (transactionHash) {
              pushLog("ZeroDev receipt received", {
                transactionHash,
              });
            } else {
              pushLog("ZeroDev receipt did not include a transaction hash", {
                submittedHash,
              });
            }
          } catch (error) {
            pushLog("ZeroDev receipt wait did not return a transaction hash", {
              error: sanitizeExternalErrorMessage(error),
            });
            transactionHash = undefined;
          }
        } else {
          pushLog("ZeroDev client has no receipt waiter; leaving at submitted");
        }
        let inclusion: UserOperationInclusionResponse | undefined;
        if (!transactionHash) {
          try {
            pushLog("Checking Monad EntryPoint inclusion", {
              sender: evmDepositWallet.address,
              submittedHash,
            });
            const inclusionEnvelope = await checkMonadInclusion({
              asset: validated.asset,
              sender: evmDepositWallet.address as Hex,
              userOperationHash: submittedHash,
            });
            if (inclusionEnvelope.ok) {
              inclusion = inclusionEnvelope.data;
              transactionHash = inclusion.transactionHash;
              pushLog("Monad EntryPoint inclusion check completed", {
                entryPointLogs: inclusion.entryPointLogs.length,
                included: inclusion.included,
                latestBlock: inclusion.latestBlock,
                searchedBlocks: inclusion.searchedBlocks,
                senderState: inclusion.senderState,
                transactionHash,
              });
            } else {
              pushLog(
                "Monad EntryPoint inclusion check failed",
                inclusionEnvelope.error,
              );
            }
          } catch (error) {
            pushLog(
              "Monad EntryPoint inclusion check failed",
              sanitizeExternalErrorMessage(error),
            );
          }
        }
        const includedOnMonad = Boolean(transactionHash || inclusion?.included);
        const notIncluded = Boolean(inclusion && !inclusion.included);
        setState(stateWithLogs({
          busy: false,
          stage: includedOnMonad
            ? "confirmed"
            : notIncluded
              ? "not_included"
              : "submitted",
          bytecode: envelope.data,
          calls,
          ...(notIncluded
            ? {
                error: {
                  stage: "not_included",
                  message:
                    "ZeroDev returned a user operation hash, but no Monad EntryPoint UserOperationEvent was found in the searched block range.",
                  details: inclusion,
                },
              }
            : {}),
          submitted: {
            submittedHash,
            ...(transactionHash ? { transactionHash } : {}),
            ...(inclusion ? { inclusion } : {}),
          },
        }));
      } catch (error) {
        pushLog("ZeroDev batch failed", sanitizeExternalErrorMessage(error));
        setState(stateWithLogs({
          busy: false,
          stage: "batch",
          bytecode: envelope.data,
          calls,
          error: batchError(error, validated.chainId),
        }));
      }
    },
    [connectorName, evmDepositWallet, evmPrimaryWallet, isZeroDevWallet],
  );

  return {
    state,
    summary,
    canSubmit,
    disabledReason,
    smartWalletAddress,
    connectorName,
    isZeroDevWallet,
    reset,
    startDeposit,
  };
}
