/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Recommended for identifying potential issues
  // Note: reactCompiler is an experimental/Next 15 feature. 
  // If you are on Next 15, ensure your dependencies are compatible.
};

// Default runtime cache rules from next-pwa
const defaultCache = require("next-pwa/cache");

const withPWA = require("next-pwa")({
  dest: "public",
  // CHANGED: disable is now false so you can test the "Install" button in dev mode.
  // Tip: If caching makes development difficult later, change this back to:
  // disable: process.env.NODE_ENV === "development",
  disable: false, 
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    // 1. Travel pack JSON: NetworkFirst strategy
    {
      urlPattern: /\/api\/travel-packs\/?(\?.*)?$/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "travel-packs-api",
        networkTimeoutSeconds: 10,
        expiration: { 
          maxEntries: 32, 
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        },
      },
    },
    // 2. Cities list: NetworkFirst strategy
    {
      urlPattern: /\/api\/cities\/list\/?/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "cities-list-api",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 1, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    // 3. City search/autocomplete: NetworkFirst strategy
    {
      urlPattern: /\/api\/cities\/?(\?.*)?$/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "cities-search-api",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 },
      },
    },
    // 4. Spread default Next-PWA cache rules for assets, fonts, and images
    ...defaultCache,
  ],
});

module.exports = withPWA(nextConfig);