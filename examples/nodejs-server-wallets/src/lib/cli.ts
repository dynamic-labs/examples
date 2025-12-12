/**
 * CLI Utilities
 *
 * Shared helpers for command-line scripts to reduce boilerplate
 * and standardize argument parsing across all demos.
 */

/**
 * Wrapper to eliminate duplicated main() boilerplate.
 * Handles try/catch and process.exit() consistently.
 *
 * @example
 * runScript(async () => {
 *   // Your script logic here
 *   console.info("Done!");
 * });
 */
export async function runScript(fn: () => Promise<void>): Promise<never> {
  try {
    await fn();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

/**
 * Standardized argument parsing for CLI scripts.
 *
 * @example
 * const { positional, getFlag, hasFlag } = parseArgs(process.argv);
 *
 * // Get positional args (non-flag arguments)
 * const command = positional[0]; // e.g., "zerodev" from "pnpm send-txn zerodev"
 *
 * // Get flag values
 * const address = getFlag("address"); // e.g., "0x123..." from "--address 0x123..."
 *
 * // Check boolean flags
 * const shouldSave = hasFlag("save"); // true if "--save" is present
 */
export function parseArgs(argv: string[]) {
  const args = argv.slice(2);

  return {
    /** Non-flag arguments in order */
    positional: args.filter((a) => !a.startsWith("--")),

    /** Get the value following a --flag */
    getFlag: (name: string): string | undefined => {
      const idx = args.indexOf(`--${name}`);
      return idx !== -1 ? args[idx + 1] : undefined;
    },

    /** Check if a --flag is present */
    hasFlag: (name: string): boolean => args.includes(`--${name}`),
  };
}
