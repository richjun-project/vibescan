/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // Allow cross-origin requests from local network for development
  allowedDevOrigins: [
    '192.168.45.77',
    '192.168.45.77:3001',
    'localhost',
    '127.0.0.1',
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
