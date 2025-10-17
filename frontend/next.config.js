const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Allow cross-origin requests from local network for development
  allowedDevOrigins: [
    '192.168.45.77',
    '192.168.45.77:3001',
    'localhost',
    '127.0.0.1',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    }
    return config
  },
};

module.exports = nextConfig;
