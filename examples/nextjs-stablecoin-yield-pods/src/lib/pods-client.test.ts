import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildDepositBytecodeUrl,
  getDepositBytecode,
  redactForClient,
  resetRateLimitsForTests,
  validateDepositRequest,
  validateProxyAccess,
  validateScopedProxyAccess,
} from "./pods-client";
import type { DepositBytecodeRequest, PodsBytecodeCall } from "./pods-types";

const wallet = "0x1111111111111111111111111111111111111111";
const asset = "0x754704Bc059F8C67012fEd69BC8A327a5aafb603";
const apiEnv = {
  NODE_ENV: "development",
  PODS_API_KEY: "pods-secret",
  PODS_API_URL: "https://api.example.test",
};

const bytecode: PodsBytecodeCall[] = [
  {
    to: "0x2222222222222222222222222222222222222222",
    value: "0",
    data: "0x1234",
  },
  {
    to: "0x3333333333333333333333333333333333333333",
    value: "100",
    data: "0xabcd",
  },
];

beforeEach(() => {
  resetRateLimitsForTests();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requestInput(): DepositBytecodeRequest {
  return {
    strategyId: "Morpho-hyperUSDCa-monad",
    chainId: 143,
    amount: "1000000",
    asset,
    wallet,
  };
}

describe("validateDepositRequest", () => {
  it("accepts the Monad Pods deposit fixture", () => {
    const result = validateDepositRequest(requestInput());

    expect(result).toEqual({
      ok: true,
      value: requestInput(),
    });
  });

  it("rejects nil, empty, malformed, and unknown input before Pods", () => {
    expect(validateDepositRequest(null).ok).toBe(false);
    expect(
      validateDepositRequest({
        strategyId: "",
        chainId: 143,
        amount: "1",
        asset,
        wallet,
      }).ok,
    ).toBe(false);
    expect(
      validateDepositRequest({
        ...requestInput(),
        chainId: 1,
      }).ok,
    ).toBe(false);
    expect(
      validateDepositRequest({
        ...requestInput(),
        amount: "0",
      }).ok,
    ).toBe(false);
    expect(
      validateDepositRequest({
        ...requestInput(),
        asset: "USDC",
      }).ok,
    ).toBe(false);
    expect(
      validateDepositRequest({
        ...requestInput(),
        extra: true,
      }).ok,
    ).toBe(false);
  });
});

describe("buildDepositBytecodeUrl", () => {
  it("builds the Pods bytecode URL without output=userOperation", () => {
    const url = new URL(
      buildDepositBytecodeUrl(requestInput(), {
        PODS_API_URL: "https://api.example.test/",
      }),
    );

    expect(url.origin).toBe("https://api.example.test");
    expect(url.pathname).toBe("/strategies/Morpho-hyperUSDCa-monad/bytecode");
    expect(url.searchParams.get("action")).toBe("lend");
    expect(url.searchParams.get("chainId")).toBe("143");
    expect(url.searchParams.get("amount")).toBe("1000000");
    expect(url.searchParams.get("asset")).toBe(asset);
    expect(url.searchParams.get("wallet")).toBe(wallet);
    expect(url.searchParams.has("output")).toBe(false);
  });
});

describe("validateProxyAccess", () => {
  it("rejects cross-origin and production-without-opt-in requests", () => {
    expect(
      validateProxyAccess(
        new Headers({
          origin: "https://evil.example",
          host: "localhost:3000",
        }),
        { NODE_ENV: "development" },
      ).ok,
    ).toBe(false);

    expect(
      validateProxyAccess(new Headers({ host: "example.com" }), {
        NODE_ENV: "production",
      }).ok,
    ).toBe(false);
  });

  it("rate limits repeated requests from the same caller before wallet input is trusted", () => {
    const headers = new Headers({
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "x-forwarded-for": "203.0.113.10",
    });

    for (let i = 0; i < 30; i += 1) {
      expect(validateProxyAccess(headers, { NODE_ENV: "development" }).ok).toBe(
        true,
      );
      const rotatedWallet = `0x${String(i + 1).padStart(40, "0")}`;
      expect(validateScopedProxyAccess("wallet", rotatedWallet).ok).toBe(true);
    }
    expect(validateProxyAccess(headers, { NODE_ENV: "development" }).ok).toBe(
      false,
    );
  });

  it("keeps a second scoped rate limit for repeated wallet values", () => {
    for (let i = 0; i < 30; i += 1) {
      expect(validateScopedProxyAccess("wallet", wallet).ok).toBe(true);
    }
    expect(validateScopedProxyAccess("wallet", wallet).ok).toBe(false);
  });
});

describe("getDepositBytecode", () => {
  it("returns setup errors without touching fetch when PODS_API_KEY is missing", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await getDepositBytecode(requestInput(), {
      env: {},
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requests Pods bytecode and normalizes the ordered call list", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        id: "action-1",
        chainId: 143,
        bytecode,
      }),
    );

    const result = await getDepositBytecode(requestInput(), {
      env: apiEnv,
      fetchImpl,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        id: "action-1",
        chainId: 143,
        bytecode,
        requestUrl:
          "https://api.example.test/strategies/Morpho-hyperUSDCa-monad/bytecode?action=lend&chainId=143&amount=1000000&asset=0x754704Bc059F8C67012fEd69BC8A327a5aafb603&wallet=0x1111111111111111111111111111111111111111",
        raw: {
          id: "action-1",
          chainId: 143,
          bytecode,
        },
      },
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain("/strategies/Morpho-hyperUSDCa-monad/bytecode");
    expect(url).not.toContain("output=userOperation");
    expect(init?.method).toBe("GET");
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      "x-api-key": "pods-secret",
    });
  });

  it("maps request transport failures and timeouts to request-stage envelopes", async () => {
    const networkResult = await getDepositBytecode(requestInput(), {
      env: apiEnv,
      fetchImpl: vi.fn<typeof fetch>().mockRejectedValue(new TypeError("offline")),
    });
    expect(networkResult.ok).toBe(false);
    if (!networkResult.ok) {
      expect(networkResult.error.stage).toBe("request");
      expect(networkResult.error.status).toBe(502);
    }

    const timeoutError = Object.assign(new Error("deadline exceeded"), {
      name: "TimeoutError",
    });
    const timeoutResult = await getDepositBytecode(requestInput(), {
      env: apiEnv,
      fetchImpl: vi.fn<typeof fetch>().mockRejectedValue(timeoutError),
    });
    expect(timeoutResult.ok).toBe(false);
    if (!timeoutResult.ok) {
      expect(timeoutResult.error.stage).toBe("request");
      expect(timeoutResult.error.status).toBe(504);
    }
  });

  it("classifies malformed 2xx Pods payloads as upstream request failures", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ id: "x" }));

    const result = await getDepositBytecode(requestInput(), {
      env: apiEnv,
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.stage).toBe("request");
      expect(result.error.status).toBe(502);
      expect(result.error.message).toContain("bytecode");
    }
  });
});

describe("redactForClient", () => {
  it("redacts signatures, paymaster data, and api keys", () => {
    expect(
      redactForClient({
        signature: "0x1234",
        paymasterAndData: "0xabcd",
        apiKey: "secret",
        message: "AA24 wrong signer",
      }),
    ).toEqual({
      signature: "[redacted]",
      paymasterAndData: "[redacted]",
      apiKey: "[redacted]",
      message: "AA24 wrong signer",
    });
  });

  it("caps wide debug objects before returning them to the browser", () => {
    const widePayload = Object.fromEntries(
      Array.from({ length: 60 }, (_, index) => [`key${index}`, index]),
    );

    expect(redactForClient(widePayload)).toMatchObject({
      key0: 0,
      key49: 49,
      __truncatedKeys: 10,
    });
  });
});
