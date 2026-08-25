import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /@dynamic-labs-wallet\/forward-mpc-client/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      "pino-pretty",
      "lokijs",
      "encoding",
    ];
    return config;
  },
};

export default nextConfig;
