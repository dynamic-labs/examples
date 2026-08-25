import { describe, expect, it } from "vitest";
import {
  isUserOperationReceiptPendingError,
  normalizeZeroDevBatchError,
  sanitizeExternalErrorMessage,
} from "./zerodev-errors";

describe("normalizeZeroDevBatchError", () => {
  it("explains ZeroDev project chain mapping failures", () => {
    const error = new Error(
      "HTTP request failed. Status: 400 URL: https://rpc.zerodev.app/api/v2/bundler/project-1?bundlerProvider=PIMLICO Details: ChainId not found not found for projectId project-1",
    );

    const result = normalizeZeroDevBatchError(error, 143);

    expect(result.message).toContain("project-1");
    expect(result.message).toContain("Monad mainnet 143");
    expect(result.details).toMatchObject({
      bundlerProvider: "PIMLICO",
      chainId: 143,
      projectId: "project-1",
    });
  });

  it("classifies AA21 prefund failures as sponsorship failures", () => {
    const error = new Error(
      'RPC Request failed. URL: https://rpc.zerodev.app/api/v3/project/chain/143 Request body: {"method":"zd_sponsorUserOperation","params":[{"userOp":{"sender":"0x53757D719dE5e90739939B7118815510d41eEdF2","callData":"0xaaaaaaaa","signature":"0xbbbbbbbb","authorization":{"r":"0xcccc","s":"0xdddd"}}}]} Details: UserOperation reverted during simulation with reason: AA21 didn\'t pay prefund',
    );

    const result = normalizeZeroDevBatchError(error, 143);

    expect(result.message).toContain("ZeroDev sponsorship failed");
    expect(result.details).toMatchObject({
      chainId: 143,
      reason: "AA21 didn't pay prefund",
      sender: "0x53757D719dE5e90739939B7118815510d41eEdF2",
    });
    expect(JSON.stringify(result.details)).not.toContain("0xbbbbbbbb");
    expect(JSON.stringify(result.details)).not.toContain("0xaaaaaaaa");
  });
});

describe("sanitizeExternalErrorMessage", () => {
  it("redacts signed user operation fields and truncates call data", () => {
    const result = sanitizeExternalErrorMessage(
      'Request body: {"callData":"0xaaaaaaaa","signature":"0xbbbbbbbb","r":"0xcccc","s":"0xdddd"}',
    );

    expect(result).toContain('"callData":"[truncated]"');
    expect(result).toContain('"signature":"[redacted]"');
    expect(result).toContain('"r":"[redacted]"');
    expect(result).toContain('"s":"[redacted]"');
  });
});

describe("isUserOperationReceiptPendingError", () => {
  it("treats ZeroDev receipt misses as pending", () => {
    expect(
      isUserOperationReceiptPendingError(
        new Error(
          'RPC Request failed. Request body: {"method":"eth_getUserOperationReceipt"} Details: Failed to get user operation receipt',
        ),
      ),
    ).toBe(true);
  });

  it("does not hide unrelated receipt RPC errors", () => {
    expect(
      isUserOperationReceiptPendingError(
        new Error(
          'RPC Request failed. Request body: {"method":"eth_getUserOperationReceipt"} Details: execution reverted',
        ),
      ),
    ).toBe(false);
  });
});
