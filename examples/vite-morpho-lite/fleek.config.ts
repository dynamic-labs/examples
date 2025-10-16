import { FleekConfig } from "@fleek-platform/cli";

export default {
  sites: [
    {
      slug: "morpho-fallback",
      distDir: "apps/fallback/dist",
      buildCommand: "pnpm run fallback-app:build",
    },
  ],
} satisfies FleekConfig;
