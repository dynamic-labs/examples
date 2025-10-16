import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { createCache } from "@tevm/bundler-cache";
import { runSync } from "effect/Effect";
import { glob } from "glob";
// @ts-expect-error: solc has no types
import * as solc from "solc";
import { type FileAccessObject, bundler } from "tevm/bundler/base-bundler";
import { loadConfig } from "tevm/bundler/config";

// Define your file access object just as in your original script.
const fao: FileAccessObject = {
  existsSync: existsSync,
  readFile: readFile,
  readFileSync: readFileSync,
  writeFileSync: writeFileSync,
  statSync,
  stat,
  mkdirSync,
  mkdir,
  writeFile,
  exists: async (path: string) => {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  },
};

export default function vitePluginTevmTypes(options: { include?: string[] } = {}) {
  // default pattern matches Solidity files under src
  const include = options.include ?? ["src/**/*.sol"];

  return {
    name: "vite-plugin-tevm-types",
    // @ts-expect-error: `outputOptions` intentionally untyped
    async generateBundle(outputOptions) {
      const cwd = process.cwd();
      // Find Solidity files via glob (using cwd)
      const files = glob.sync(include, { cwd });
      if (files.length === 0) {
        console.error("No Solidity files found");
      }

      // Load your tevm configuration and create the bundler
      const config = runSync(loadConfig(cwd));
      const solcCache = createCache(config.cacheDir, fao, cwd);
      const bundlerInstance = bundler(config, console, fao, solc, solcCache, "tevm/contract");

      // For each Solidity file, generate types and write them to the output directory
      for (const file of files) {
        // e.g., file: "src/contracts/MyContract.sol"
        const fileName = path.basename(file); // "MyContract.sol"
        // Resolve types via tevm bundler
        const tsContent = await bundlerInstance.resolveDts(`./${file}`, cwd, false, true);

        // Determine the output directory
        const outDir = outputOptions.dir || "dist";
        // Preserve folder structure: e.g. "src/contracts/MyContract.sol" becomes "dist/contracts/MyContract.sol.d.ts"
        const relativePath = path.relative("src", file);
        const outputFile = path.join(outDir, path.dirname(relativePath), `${fileName}.d.ts`);
        await mkdir(path.dirname(outputFile), { recursive: true });
        await writeFile(outputFile, tsContent.code);
      }
    },
  };
}
