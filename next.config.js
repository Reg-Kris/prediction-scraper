/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    APP_NAME: 'Prediction Market Aggregator',
  },
  // Enable experimental features if needed
  experimental: {
    // serverActions: true,
  },
}

module.exports = nextConfig
