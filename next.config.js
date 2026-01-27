module.exports = {
  reactStrictMode: true,
  // Explicitly disable Turbopack to use webpack
  turbopack: {},
  webpack: (config) => {
    delete config.resolve.alias['webpack'];
    return config;
  },
};
