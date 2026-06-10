import "dotenv/config";
import readline from "readline";
import { loadDelegationCredentials } from "./wallet.js";
import { setAgentWallet } from "./tools.js";
import { runAgent } from "./agent.js";
import { setReadlineForConfirm } from "./confirm.js";

// ─── Load the delegated agent wallet ─────────────────────────────────────────

const creds = loadDelegationCredentials();
if (!creds) {
  console.error(
    "No delegation credentials found. Set DELEGATED_WALLET_ID, DELEGATED_WALLET_ADDRESS, " +
      "DELEGATED_WALLET_API_KEY and DELEGATED_KEY_SHARE in your .env (see .example.env)."
  );
  process.exit(1);
}
setAgentWallet(creds);

// ─── Interactive REPL ─────────────────────────────────────────────────────────

console.log("=".repeat(60));
console.log("  Dynamic + LangGraph bare-bones agent");
console.log("=".repeat(60));
console.log("Example commands:");
console.log('  "show my wallet"');
console.log('  "what are my token balances with prices"');
console.log('  "send 0.001 ETH on ethereum to 0x..."');
console.log("  Type 'exit' to quit\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
setReadlineForConfirm(rl);

const threadId = "interactive-session";

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

rl.on("close", () => {
  console.log("\nGoodbye!");
  process.exit(0);
});

while (true) {
  const input = (await prompt("You: ")).trim();
  if (!input) continue;
  if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
    rl.close();
    break;
  }
  try {
    const response = await runAgent(input, threadId);
    console.log(`\nAgent: ${response}\n`);
  } catch (err: any) {
    console.error(`\nError: ${err?.message ?? String(err)}\n`);
  }
}
