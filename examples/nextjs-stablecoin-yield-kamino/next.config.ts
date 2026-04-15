import type { NextConfig } from "next";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { NormalModuleReplacementPlugin } = require("webpack");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { isServer, dev }) => {
    // Enable WebAssembly — required by @kamino-finance/klend-sdk and @solana/kit
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Required rule for WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
      };
    }

    // webpack's asyncWebAssembly mode trips over the wasm-bindgen "wbg" import
    // inside @evervault/wasm-attestation-bindings (pulled in by Dynamic's WaaS
    // bundle). We stub the package so the app compiles. External wallets (Phantom
    // etc.) and email/social auth are unaffected; only the hardware-attestation
    // step of MPC key generation is skipped.
    config.plugins.push(
      new NormalModuleReplacementPlugin(
        /@evervault\/wasm-attestation-bindings/,
        path.resolve(process.cwd(), "src/stubs/evervault-wasm-stub.js")
      )
    );

    return config;
  },
};

export default nextConfig;
