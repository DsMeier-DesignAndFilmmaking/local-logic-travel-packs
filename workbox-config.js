// workbox-config.js
module.exports = {
    globDirectory: 'public/',
    globPatterns: [
      '**/*.{css,ico,json}'
    ],
    swDest: 'public/sw.js',
    clientsClaim: true,
    skipWaiting: true,
  };
  