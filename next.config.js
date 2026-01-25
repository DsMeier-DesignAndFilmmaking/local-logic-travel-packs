/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force Webpack by providing a custom (even if empty) webpack config
  webpack: (config) => {
    return config;
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /\/api\/travel-packs\/?(\?.*)?$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "travel-packs-api",
        expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
  ],
});

module.exports = withPWA(nextConfig);