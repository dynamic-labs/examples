import type { NormalizedError } from "./pods-types";

const MAX_SAFE_ERROR_CHARS = 1_500;

export function normalizeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readZeroDevProjectId(message: string): string | undefined {
  return message.match(/\/bundler\/([a-zA-Z0-9-]+)/)?.[1] ??
    message.match(/projectId\s+([a-zA-Z0-9-]+)/i)?.[1];
}

function readZeroDevBundlerProvider(message: string): string | undefined {
  return message.match(/bundlerProvider=([a-zA-Z0-9_-]+)/)?.[1];
}

function readRpcUrl(message: string): string | undefined {
  return message.match(/URL:\s+(https:\/\/[^\s]+)/)?.[1];
}

function readUserOperationSender(message: string): string | undefined {
  return message.match(/"sender"\s*:\s*"(0x[a-fA-F0-9]{40})"/)?.[1];
}

export function sanitizeExternalErrorMessage(error: unknown): string {
  const message = normalizeErrorMessage(error)
    .replace(
      /("(?:signature|paymasterAndData|paymasterData|r|s)"\s*:\s*)"0x[a-fA-F0-9]+"/g,
      '$1"[redacted]"',
    )
    .replace(
      /("callData"\s*:\s*)"0x[a-fA-F0-9]+"/g,
      '$1"[truncated]"',
    );

  return message.length > MAX_SAFE_ERROR_CHARS
    ? `${message.slice(0, MAX_SAFE_ERROR_CHARS)}...[truncated]`
    : message;
}

export function isUserOperationReceiptPendingError(error: unknown): boolean {
  const message = normalizeErrorMessage(error);
  return (
    /eth_getUserOperationReceipt/i.test(message) &&
    /Failed to get user operation receipt|receipt not found|not found/i.test(
      message,
    )
  ) || /UserOperationReceiptNotFoundError/i.test(message);
}

export function normalizeZeroDevBatchError(
  error: unknown,
  chainId?: number,
): NormalizedError {
  const message = normalizeErrorMessage(error);
  const safeMessage = sanitizeExternalErrorMessage(error);
  const isZeroDevProjectChainError =
    /ChainId not found/i.test(message) &&
    message.includes("rpc.zerodev.app");

  if (isZeroDevProjectChainError) {
    const projectId = readZeroDevProjectId(message);
    return {
      stage: "batch",
      message:
        `ZeroDev project ${projectId ?? "configured in Dynamic"} is not configured for chain ${chainId ?? "the selected chain"}. ` +
        "Create or select a ZeroDev project for Monad mainnet 143, then update the Dynamic Sponsor Gas ZeroDev project id and refresh this app.",
      details: {
        bundlerProvider: readZeroDevBundlerProvider(message),
        chainId,
        originalMessage: safeMessage,
        projectId,
      },
    };
  }

  const isPrefundError =
    /AA21/i.test(message) && /didn'?t pay prefund/i.test(message);

  if (isPrefundError) {
    const sender = readUserOperationSender(message);
    return {
      stage: "batch",
      message:
        "ZeroDev sponsorship failed during paymaster simulation. The user operation reached EntryPoint without a valid paymaster prefund, so the sender would need native MON for gas.",
      details: {
        chainId,
        reason: "AA21 didn't pay prefund",
        rpcUrl: readRpcUrl(message),
        sender,
        nextSteps: [
          "Create or enable a ZeroDev gas policy for Monad mainnet 143.",
          "Make sure the policy has enough budget or gas credits and allows this batched deposit call.",
          "If you want to bypass sponsorship temporarily, fund the sender with native MON and retry.",
        ],
        originalMessage: safeMessage,
      },
    };
  }

  return {
    stage: "batch",
    message: safeMessage,
  };
}
