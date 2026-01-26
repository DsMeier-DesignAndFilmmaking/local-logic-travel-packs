/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure we don't have issues with double-rendering during hydration
  webpack: (config) => {
    return config;
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // skipWaiting and clientsClaim ensure the new SW takes over immediately
  skipWaiting: true, 
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        // 1. STRATEGIC PAGE CACHING
        // We use StaleWhileRevalidate for the main shell. 
        // This ensures the app opens INSTANTLY from the home screen, 
        // even if the network is "lie-fi" (connected but not working).
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'pages-cache',
          expiration: { 
            maxEntries: 20,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // 2. API CACHING
        // We keep this as NetworkFirst to ensure the user gets fresh 
        // travel packs if they are online, but falls back to the local version.
        urlPattern: /\/api\/travel-packs\/?(\?.*)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "travel-packs-api",
          networkTimeoutSeconds: 5,
          expiration: { 
            maxEntries: 32, 
            maxAgeSeconds: 7 * 24 * 60 * 60 
          },
        },
      },
      {
        // 3. STATIC ASSETS
        urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|json|woff2)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-assets',
          expiration: {
            maxEntries: 100,
          }
        },
      },
    ],
  },
});

module.exports = withPWA(nextConfig);