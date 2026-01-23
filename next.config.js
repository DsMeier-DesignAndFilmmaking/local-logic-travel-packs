/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Explicitly disable Turbopack since next-pwa requires webpack
  turbopack: {},
};

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // No runtimeCaching - only register the Service Worker for now
});

module.exports = withPWA(nextConfig);
