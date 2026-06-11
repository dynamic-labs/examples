/**
 * The agent — runs server-side, no UI, no human in the loop.
 *
 * The agent is bound to ONE user's wallet via that user's account code (the
 * key that links a user to their delegated wallet — shown on the funding page,
 * derived deterministically from the wallet address in the delegation store).
 *
 *   - First run, no binding yet → prints the funding URL so the user can sign up,
 *     authorize their agent, and fund. They then run `pnpm agent <accountCode>`
 *     once; the agent persists that code locally (agent/.agent-account).
 *   - Every later run → `pnpm agent` reuses the saved binding, with no argument.
 *
 * Owner-only access: a wallet must be password-protected on the website before
 * the agent will act on it. Decrypting the key share requires that password
 * (supply it via AGENT_PASSWORD, or the agent prompts for it). Knowing the
 * public address/code alone is not enough — only the owner who set the password
 * can authorize spending. See lib/shared/delegation-store.ts.
 *
 * Once bound, the agent:
 *   1. loads that user's delegated wallet credentials from Supabase (decrypting
 *      with the password),
 *   2. checks the spendable USD balance,
 *   3. if empty, points the user to the funding page and stops,
 *   4. otherwise pays an x402-protected "cloud service" — a gasless USDC payment
 *      signed inside Dynamic's MPC — and uses the result.
 *
 * Run with: pnpm agent [accountCode|walletAddress]   (AGENT_PASSWORD optional)
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createPublicClient, http } from "viem";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import {
  ERC20_BALANCE_ABI,
  USDC_ADDRESS,
  VIEM_CHAIN,
  RPC_URL,
  DELEGATION_CHAIN,
  X402_NETWORK,
  formatUsd,
} from "../lib/shared/constants";
import {
  getDelegationByAddress,
  getDelegationByCode,
  getDelegationStatus,
  PasswordRequiredError,
  type DelegationRecord,
} from "../lib/shared/delegation-store";
import { createDynamicX402Account } from "../lib/shared/x402-account";

const SERVICE_URL =
  process.env.X402_SERVICE_URL ??
  "http://localhost:3000/api/services/azure-compute";
const FUNDING_URL = process.env.FUNDING_URL ?? "http://localhost:3000";
const PRICE_USD_BASE_UNITS = BigInt(10_000); // $0.01 in USDC (6 decimals)

// Where the agent remembers which account (user→wallet) it's bound to.
const ACCOUNT_FILE = join(__dirname, ".agent-account");

function readBoundAccount(): string | null {
  try {
    const code = readFileSync(ACCOUNT_FILE, "utf8").trim();
    return code || null;
  } catch {
    return null; // not bound yet
  }
}

function persistBoundAccount(selector: string) {
  try {
    writeFileSync(ACCOUNT_FILE, `${selector}\n`, "utf8");
  } catch (err) {
    console.warn(
      "⚠️  Could not persist the bound account:",
      err instanceof Error ? err.message : err
    );
  }
}

/** Thrown when the bound wallet hasn't been password-protected on the website yet. */
class UnsecuredWalletError extends Error {}

/** Read a password from the terminal without echoing it. */
function promptHiddenPassword(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      reject(
        new Error(
          "No interactive terminal for a password prompt — set AGENT_PASSWORD instead."
        )
      );
      return;
    }
    stdout.write(query);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let input = "";
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\n" || ch === "\r" || ch === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          stdout.write("\n");
          resolve(input);
          return;
        } else if (ch === "\u0003") {
          stdin.setRawMode(false);
          process.exit(1);
        } else if (ch === "\u007f" || ch === "\b") {
          if (input) {
            input = input.slice(0, -1);
            stdout.write("\b \b");
          }
        } else {
          input += ch;
          stdout.write("*");
        }
      }
    };
    stdin.on("data", onData);
  });
}

function resolveBySelector(selector: string, password?: string) {
  return selector.startsWith("0x")
    ? getDelegationByAddress(selector, DELEGATION_CHAIN, password)
    : getDelegationByCode(selector, DELEGATION_CHAIN, password);
}

/**
 * Resolve which delegated wallet this agent acts for.
 *
 * Precedence: explicit CLI arg / AGENT_ACCOUNT env → the saved local binding.
 * Secured wallets need their password (AGENT_PASSWORD, else an interactive
 * prompt). The agent refuses wallets that haven't been secured yet. Returns
 * null only when nothing is bound (first run → onboarding prompt).
 */
async function loadDelegation(): Promise<DelegationRecord | null> {
  const explicit =
    process.env.AGENT_ACCOUNT ?? process.argv[2] ?? process.env.AGENT_WALLET_ADDRESS;
  const selector = explicit ?? readBoundAccount();

  if (!selector) return null;

  let delegation: DelegationRecord | undefined;
  try {
    delegation = await resolveBySelector(selector, process.env.AGENT_PASSWORD || undefined);
  } catch (err) {
    if (!(err instanceof PasswordRequiredError)) throw err;
    // Secured wallet and no/!valid AGENT_PASSWORD — ask for it interactively.
    const password = await promptHiddenPassword("🔑 Wallet password: ");
    try {
      delegation = await resolveBySelector(selector, password);
    } catch (retryErr) {
      if (retryErr instanceof PasswordRequiredError) {
        throw new Error("Incorrect password.");
      }
      throw retryErr;
    }
  }

  if (!delegation) {
    throw new Error(
      `No delegation found for "${selector}". Has the user authorized the agent ` +
        "(and did the Dynamic webhook store it)?"
    );
  }

  // Enforce owner-only access: the agent only acts on password-protected wallets.
  const { secured } = await getDelegationStatus(delegation.address, DELEGATION_CHAIN);
  if (!secured) throw new UnsecuredWalletError();

  // Remember an explicitly-provided account so `pnpm agent` works with no args next time.
  if (explicit) persistBoundAccount(delegation.code ?? selector);

  return delegation;
}

async function getBalanceBaseUnits(address: string): Promise<bigint> {
  const client = createPublicClient({
    chain: VIEM_CHAIN,
    transport: http(RPC_URL),
  });
  return client.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });
}

async function main() {
  console.log("🤖 Agent starting…\n");

  const delegation = await loadDelegation();

  if (!delegation) {
    console.log("⚠️  This agent isn't linked to a wallet yet.\n");
    console.log("To set up your agent wallet:");
    console.log(`  1. Visit ${FUNDING_URL}`);
    console.log("  2. Sign in with your email");
    console.log("  3. Click \"Authorize agent\" to delegate signing access");
    console.log("  4. Set a password to secure your agent");
    console.log("  5. Add funds via MoonPay");
    console.log(
      "  6. Copy your account code from the page, then run: `pnpm agent <accountCode>`"
    );
    console.log(
      "     (the agent remembers it — after that, just `pnpm agent`)\n"
    );
    return;
  }

  console.log(`Account ${delegation.code} → wallet ${delegation.address}`);

  // 1. Check funds
  const balance = await getBalanceBaseUnits(delegation.address);
  console.log(`Balance: $${formatUsd(balance)}`);

  if (balance < PRICE_USD_BASE_UNITS) {
    console.log(
      `\n⚠️  Not enough funds to pay for the service ($${formatUsd(
        PRICE_USD_BASE_UNITS
      )}).`
    );
    console.log(`👉 Ask the user to add funds at: ${FUNDING_URL}\n`);
    return;
  }

  // 2. Build an x402 signer backed by the delegated MPC wallet (gasless EIP-3009)
  //    and register it for Base mainnet on an x402 v2 client.
  const account = createDynamicX402Account(delegation);
  const client = new x402Client().register(
    X402_NETWORK,
    new ExactEvmScheme(account)
  );
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  // 3. Pay for the service. x402 handles the 402 → sign → retry handshake.
  console.log(`\n💳 Paying for service: ${SERVICE_URL}`);
  const res = await fetchWithPayment(SERVICE_URL, { method: "GET" });

  if (!res.ok) {
    console.error(`Service call failed: HTTP ${res.status}`);
    console.error(await res.text());
    process.exitCode = 1;
    return;
  }

  const result = await res.json();
  console.log("\n✅ Service delivered (paid $0.01):");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  if (err instanceof UnsecuredWalletError) {
    console.log("⚠️  This wallet isn't password-protected yet.\n");
    console.log(
      `👉 Secure it first: open ${FUNDING_URL}, then "Secure your agent" and set a password.\n`
    );
    return;
  }
  console.error("\n❌ Agent error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
