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
  cacheOnFrontEndNav: true, // Crucial for Next.js app router
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    runtimeCaching: [
      // 1. CACHE THE PAGES (HTML)
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: {
            maxEntries: 50,
          },
        },
      },
      // 2. CACHE THE API DATA (Your Travel Packs)
      {
        urlPattern: /\/api\/travel-packs\/?(\?.*)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "travel-packs-api",
          expiration: { 
            maxEntries: 32, 
            maxAgeSeconds: 7 * 24 * 60 * 60 
          },
        },
      },
      // 3. CACHE STATIC ASSETS (JS, CSS, Images)
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