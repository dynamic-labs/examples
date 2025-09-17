import { Connect, defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs/promises";

const wasmMiddleware = (): Plugin => ({
  name: "wasm-middleware",
  configureServer: (server) => {
    server.middlewares.use(
      async (
        req: Connect.IncomingMessage,
        res: any,
        next: Connect.NextFunction
      ) => {
        if (req.url?.endsWith(".wasm")) {
          // Directly point to the .wasm file within the realm/dist directory
          const wasmPath = path.join(
            process.cwd(),
            "node_modules/@dynamic-labs-wallet/browser/internal/web/generated",
            path.basename(req.url)
          );
          try {
            const wasmFile = await fs.readFile(wasmPath);
            res.setHeader("Content-Type", "application/wasm");
            res.end(wasmFile);
          } catch (error) {
            next();
          }
          return;
        }
        next();
      }
    );
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasmMiddleware()],
  define: {
    "process.env": process.env,
  },
});
