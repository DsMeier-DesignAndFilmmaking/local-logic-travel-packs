/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Explicitly disable Turbopack since next-pwa requires webpack
  turbopack: {},
};

// Default runtime cache rules from next-pwa (fonts, images, /api/, others, cross-origin).
// We prepend travel-pack–specific rules so they take precedence over the generic /api/ handler.
const defaultCache = require("next-pwa/cache");

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    // — Travel pack JSON: NetworkFirst, 7d. Primary offline source remains localStorage; SW is fallback.
    {
      urlPattern: /\/api\/travel-packs\/?(\?.*)?$/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "travel-packs",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    // — Cities list for preload / “downloaded cities”: NetworkFirst, 1d
    {
      urlPattern: /\/api\/cities\/list\/?/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "cities-list",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 1, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    // — City autocomplete: NetworkFirst, 1h
    {
      urlPattern: /\/api\/cities\/?(\?.*)?$/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "cities-search",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 },
      },
    },
    ...defaultCache,
  ],
});

module.exports = withPWA(nextConfig);
