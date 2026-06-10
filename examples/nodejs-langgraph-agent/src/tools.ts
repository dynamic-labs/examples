import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { isAddress, parseEther, formatEther } from "viem";
import { confirm } from "./confirm.js";
import {
  getChainById,
  sendTransactionDelegated,
  type DelegationCredentials,
} from "./wallet.js";

// ─── Agent wallet (set once at startup) ──────────────────────────────────────

let agentWallet: DelegationCredentials | null = null;

export function setAgentWallet(creds: DelegationCredentials): void {
  agentWallet = creds;
  console.log(`[agent-wallet] Loaded delegated wallet: ${creds.walletAddress}`);
}

function requireWallet(): DelegationCredentials {
  if (!agentWallet) {
    throw new Error("No agent wallet loaded. Set delegation credentials in .env.");
  }
  return agentWallet;
}

function toolError(err: unknown): string {
  return JSON.stringify({
    success: false,
    error: err instanceof Error ? err.message : String(err),
  });
}

// ─── list_wallets ─────────────────────────────────────────────────────────────

export const listWalletsTool = tool(
  async () => {
    if (!agentWallet) {
      return JSON.stringify({ wallets: [], message: "No agent wallet loaded" });
    }
    return JSON.stringify({
      wallets: [
        {
          label: "agent",
          address: agentWallet.walletAddress,
          type: "delegated (user's wallet)",
        },
      ],
    });
  },
  {
    name: "list_wallets",
    description: "Show the agent's delegated wallet address.",
    schema: z.object({}),
  }
);

// ─── get_token_balances (Dynamic multi-chain balances API) ───────────────────

export const getTokenBalancesTool = tool(
  async ({ chainName, networkId, includePrices }) => {
    try {
      const wallet = requireWallet();
      const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID;
      const userJwt = process.env.DYNAMIC_USER_JWT;
      if (!environmentId || !userJwt) {
        return toolError(new Error("DYNAMIC_ENVIRONMENT_ID or DYNAMIC_USER_JWT not set"));
      }

      const chain = chainName?.toUpperCase() ?? "EVM";

      // Decode the JWT payload to extract the session public key (no verification).
      let sessionPublicKey: string | undefined;
      try {
        const payload = JSON.parse(
          Buffer.from(userJwt.split(".")[1], "base64url").toString("utf8")
        );
        sessionPublicKey = payload.session_public_key;
      } catch {
        // not fatal — header is optional
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${userJwt}`,
        "Content-Type": "application/json",
      };
      if (sessionPublicKey) headers["x-dyn-session-public-key"] = sessionPublicKey;

      // The balances API requires a networkId; fan out across popular EVM chains
      // when none is specified.
      const networkIds = networkId ? [networkId] : [1, 137, 8453, 42161, 56, 10];

      const fetchForNetwork = async (netId: number) => {
        const url = new URL(
          `https://app.dynamicauth.com/api/v0/sdk/${environmentId}/chains/${chain}/balances`
        );
        url.searchParams.set("accountAddress", wallet.walletAddress);
        url.searchParams.set("includeNative", "true");
        url.searchParams.set("filterSpamTokens", "true");
        url.searchParams.set("networkId", String(netId));
        if (includePrices) url.searchParams.set("includePrices", "true");

        const res = await fetch(url.toString(), { headers });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      };

      const items = (await Promise.all(networkIds.map(fetchForNetwork))).flat();

      return JSON.stringify({
        success: true,
        address: wallet.walletAddress,
        chain,
        networkId: networkId ?? "all",
        tokens: items.map((t: any) => ({
          name: t.name,
          symbol: t.symbol,
          balance: t.balance,
          networkId: t.networkId,
          ...(t.price != null && { priceUsd: t.price }),
          ...(t.marketValue != null && { valueUsd: t.marketValue }),
          isNative: t.isNative ?? false,
        })),
      });
    } catch (err) {
      return toolError(err);
    }
  },
  {
    name: "get_token_balances",
    description:
      "Get token balances for the agent's delegated wallet using Dynamic's multi-chain " +
      "balances API. Use networkId to filter to a specific chain (e.g. 1 = Ethereum, " +
      "137 = Polygon, 8453 = Base). Pass includePrices=true for USD values.",
    schema: z.object({
      chainName: z
        .string()
        .optional()
        .describe("Chain type: ETH, EVM, SOL, BTC, etc. Defaults to EVM."),
      networkId: z
        .number()
        .optional()
        .describe("Specific network ID (1 = Ethereum, 137 = Polygon, 8453 = Base)"),
      includePrices: z
        .boolean()
        .optional()
        .describe("Include USD prices and market values"),
    }),
  }
);

// ─── send_transaction (signs via Dynamic MPC, gated by a confirm prompt) ─────

export const sendTransactionTool = tool(
  async ({ to, amountEth, chainId }) => {
    try {
      const wallet = requireWallet();
      if (!isAddress(to)) {
        return toolError(new Error(`"${to}" is not a valid EVM address`));
      }

      const value = parseEther(amountEth);
      const chain = getChainById(chainId);

      const ok = await confirm(
        `Send native transfer\n` +
          `  Chain:  ${chain.name} (${chainId})\n` +
          `  From:   ${wallet.walletAddress}\n` +
          `  To:     ${to}\n` +
          `  Amount: ${formatEther(value)} ${chain.nativeCurrency.symbol}`
      );
      if (!ok) {
        return JSON.stringify({ success: false, error: "User declined the transaction" });
      }

      const hash = await sendTransactionDelegated(
        wallet,
        chainId,
        to as `0x${string}`,
        value
      );
      return JSON.stringify({ success: true, transactionHash: hash, chainId });
    } catch (err) {
      return toolError(err);
    }
  },
  {
    name: "send_transaction",
    description:
      "Send a native-currency transfer (e.g. ETH, POL) from the agent's delegated wallet. " +
      "Signs via Dynamic MPC and broadcasts. The user is always prompted to confirm before " +
      "the transaction is sent.",
    schema: z.object({
      to: z.string().describe("Recipient EVM address (0x...)"),
      amountEth: z
        .string()
        .describe("Amount to send, in whole native units (e.g. \"0.01\")"),
      chainId: z
        .number()
        .describe("EVM chain ID (1 = Ethereum, 137 = Polygon, 8453 = Base)"),
    }),
  }
);

export const allTools = [listWalletsTool, getTokenBalancesTool, sendTransactionTool];
