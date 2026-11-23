import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nécessaire pour l'image Docker de prod (build multi-étapes copiant .next/standalone + .next/static
  // — voir Dockerfile et .github/workflows/deploy.yml), même pattern que lacaeducation-ui.
  output: "standalone",
  // Le badge flottant de dev (déplaçable au doigt) se superposait à la barre d'onglets mobile et
  // donnait l'impression d'un bug de mise en page glissante lors des tests sur téléphone en
  // développement local (signalé par l'utilisateur sur iPhone) — sans effet en production (déjà
  // absent d'un build `next build`), mais autant l'enlever aussi en dev.
  devIndicators: false,
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
