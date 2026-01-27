module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    delete config.resolve.alias['webpack'];
    return config;
  },
};
