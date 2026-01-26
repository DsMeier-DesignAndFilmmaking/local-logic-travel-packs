/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    return config;
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    // PRE-CACHE the home page and main assets immediately on first visit
    importScripts: [], 
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          networkTimeoutSeconds: 3, // If network is slow, fallback to cache fast
          expiration: { maxEntries: 50 },
        },
      },
      {
        urlPattern: /\/api\/travel-packs\/?(\?.*)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "travel-packs-api",
          expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|json|woff2)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-assets',
        },
      },
    ],
  },
});

module.exports = withPWA(nextConfig);