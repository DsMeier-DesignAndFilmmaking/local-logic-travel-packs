/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This helps "silence" the Turbopack warning as requested by the error log
  experimental: {
    turbopack: {} 
  }
};

const defaultCache = require("next-pwa/cache");

const withPWA = require("next-pwa")({
  dest: "public",
  // Ensure this is only disabled in dev so Webpack is free to run in Prod
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      urlPattern: /\/api\/travel-packs\/?(\?.*)?$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "travel-packs-api",
        expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    ...defaultCache,
  ],
});

module.exports = withPWA(nextConfig);