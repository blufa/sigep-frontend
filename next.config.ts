import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nécessaire pour l'image Docker de prod (build multi-étapes copiant .next/standalone + .next/static
  // — voir Dockerfile et .github/workflows/deploy.yml), même pattern que lacaeducation-ui.
  output: "standalone",
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
