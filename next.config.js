/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8080'
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }]
  },
}

module.exports = nextConfig
