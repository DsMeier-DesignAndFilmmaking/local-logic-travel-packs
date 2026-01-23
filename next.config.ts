import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

const pwa = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
        },
      },
    },
    {
      urlPattern: /\/api\/travel-packs.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "travelPacksCache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    {
      urlPattern: /\/api\/cities\/list/,
      handler: "NetworkFirst",
      options: {
        cacheName: "citiesListCache",
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
      },
    },
  ],
});

export default pwa(nextConfig as any);
