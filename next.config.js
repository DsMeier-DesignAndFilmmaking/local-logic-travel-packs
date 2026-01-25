/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We remove the turbopack: {} key because it confuses the --webpack flag
};

const defaultCache = require("next-pwa/cache");

const withPWA = require("next-pwa")({
  dest: "public",
  // We disable in dev to let you work, but enable for build
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    {
      urlPattern: /\/api\/travel-packs\/?(\?.*)?$/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "travel-packs-api",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/api\/cities\/list\/?/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "cities-list-api",
        expiration: { maxEntries: 1, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/api\/cities\/?(\?.*)?$/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "cities-search-api",
        expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 },
      },
    },
    ...defaultCache,
  ],
});

module.exports = withPWA(nextConfig);