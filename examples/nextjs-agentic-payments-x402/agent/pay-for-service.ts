/**
 * The agent — runs server-side, paying for services on a user's behalf.
 *
 * The agent is bound to ONE user's wallet by its address (shown on the funding
 * page). First run: `pnpm agent <walletAddress>` (persisted to agent/.agent-account);
 * later runs: just `pnpm agent`.
 *
 * Owner-only access via a self-hosted device-authorization grant: before acting,
 * the agent asks the web app to start a grant, prints an /authorize link + code,
 * and waits. The wallet owner opens the link, signs in with Dynamic, and approves
 * — the server verifies their session JWT owns the wallet. Only then does the
 * agent proceed. Knowing the public address alone authorizes nothing.
 *
 * Once approved, the agent:
 *   1. loads the delegated wallet credentials from Supabase,
 *   2. checks the spendable USD balance,
 *   3. if empty, points the user to the funding page and stops,
 *   4. otherwise pays an x402-protected "cloud service" — a gasless USDC payment
 *      signed inside Dynamic's MPC — and uses the result.
 *
 * Run with: pnpm agent [walletAddress]
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { execFile } from "child_process";
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
  type DelegationRecord,
} from "../lib/shared/delegation-store";
import { createDynamicX402Account } from "../lib/shared/x402-account";

const SERVICE_URL =
  process.env.X402_SERVICE_URL ??
  "http://localhost:3000/api/services/azure-compute";
const FUNDING_URL = process.env.FUNDING_URL ?? "http://localhost:3000";
const GRANT_API = `${FUNDING_URL}/api/agent-grant`;
const PRICE_USD_BASE_UNITS = BigInt(10_000); // $0.01 in USDC (6 decimals)

// Where the agent remembers which wallet address it's bound to.
const ACCOUNT_FILE = join(__dirname, ".agent-account");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readBoundAddress(): string | null {
  try {
    return readFileSync(ACCOUNT_FILE, "utf8").trim() || null;
  } catch {
    return null; // not bound yet
  }
}

function persistBoundAddress(address: string) {
  try {
    writeFileSync(ACCOUNT_FILE, `${address}\n`, "utf8");
  } catch (err) {
    console.warn(
      "⚠️  Could not persist the bound wallet address:",
      err instanceof Error ? err.message : err
    );
  }
}

/** Best-effort: open the approval URL in the user's browser (ignored if headless). */
function tryOpenBrowser(url: string) {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "cmd"
        : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  execFile(cmd, args, () => {
    /* ignore — the URL is printed too */
  });
}

/**
 * Owner-authorization gate: start a device grant, show the owner an /authorize
 * link, and wait until they approve (or it's denied/expires). Returns true on
 * approval.
 */
async function acquireAuthorization(address: string): Promise<boolean> {
  const startRes = await fetch(GRANT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (!startRes.ok) {
    throw new Error(`Failed to start authorization (HTTP ${startRes.status}).`);
  }
  const { userCode, grantCode, verificationUri, expiresInSeconds, pollIntervalSeconds } =
    await startRes.json();

  console.log("\n🔐 Approve this agent to act on your wallet:");
  console.log(`   ${verificationUri}`);
  console.log(`   code: ${userCode}\n`);
  tryOpenBrowser(verificationUri);
  process.stdout.write("⏳ Waiting for approval…");

  const deadline = Date.now() + expiresInSeconds * 1000;
  const intervalMs = Math.max(pollIntervalSeconds ?? 3, 2) * 1000;
  while (Date.now() < deadline) {
    await sleep(intervalMs);
    process.stdout.write(".");
    const pollRes = await fetch(
      `${GRANT_API}?grant_code=${encodeURIComponent(grantCode)}`
    );
    if (pollRes.status === 404) {
      console.log("\n⚠️  Authorization request expired. Run the agent again.");
      return false;
    }
    if (!pollRes.ok) continue;
    const { status } = await pollRes.json();
    if (status === "approved") {
      console.log("\n✅ Approved.\n");
      return true;
    }
    if (status === "denied") {
      console.log("\n🚫 Request denied.");
      return false;
    }
  }
  console.log("\n⚠️  Authorization timed out. Run the agent again.");
  return false;
}

async function getBalanceBaseUnits(address: string): Promise<bigint> {
  const client = createPublicClient({ chain: VIEM_CHAIN, transport: http(RPC_URL) });
  return client.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });
}

function printOnboarding() {
  console.log("⚠️  This agent isn't linked to a wallet yet.\n");
  console.log("To set up your agent wallet:");
  console.log(`  1. Visit ${FUNDING_URL}`);
  console.log("  2. Sign in with your email");
  console.log('  3. Click "Authorize agent" to delegate signing access');
  console.log("  4. Add funds via MoonPay");
  console.log(
    "  5. Copy your wallet address from the page, then run: `pnpm agent <walletAddress>`"
  );
  console.log("     (the agent remembers it — after that, just `pnpm agent`)\n");
}

async function main() {
  console.log("🤖 Agent starting…\n");

  const explicit = process.argv[2] ?? process.env.AGENT_WALLET_ADDRESS;
  const address = explicit ?? readBoundAddress();
  if (!address) {
    printOnboarding();
    return;
  }

  // Confirm the wallet has been delegated (the webhook stored its share).
  const delegation: DelegationRecord | undefined = await getDelegationByAddress(
    address,
    DELEGATION_CHAIN
  );
  if (!delegation) {
    console.log(`⚠️  No delegated wallet found for ${address}.\n`);
    console.log(
      `👉 Authorize the agent at ${FUNDING_URL} (and make sure the delegation webhook is configured), then try again.\n`
    );
    return;
  }
  if (explicit) persistBoundAddress(delegation.address);
  console.log(`Wallet ${delegation.address}`);

  // Owner must approve this run via the web app.
  const approved = await acquireAuthorization(delegation.address);
  if (!approved) return;

  // 1. Check funds
  const balance = await getBalanceBaseUnits(delegation.address);
  console.log(`Balance: $${formatUsd(balance)}`);
  if (balance < PRICE_USD_BASE_UNITS) {
    console.log(
      `\n⚠️  Not enough funds to pay for the service ($${formatUsd(PRICE_USD_BASE_UNITS)}).`
    );
    console.log(`👉 Ask the user to add funds at: ${FUNDING_URL}\n`);
    return;
  }

  // 2. Build an x402 v2 signer backed by the delegated MPC wallet (gasless EIP-3009).
  const account = createDynamicX402Account(delegation);
  const client = new x402Client().register(X402_NETWORK, new ExactEvmScheme(account));
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
  console.error("\n❌ Agent error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
