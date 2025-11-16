/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    APP_NAME: 'Prediction Market Aggregator',
  },
  // Enable instrumentation for server initialization hooks
  experimental: {
    instrumentationHook: true,
  },
}

module.exports = nextConfig
