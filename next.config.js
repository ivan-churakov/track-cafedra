/** @type {import('next').NextConfig} */

const repoBasePath = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}`
  : undefined

const nextConfig = {
  images: { unoptimized: true },
  reactStrictMode: true,
  swcMinify: true,
  basePath: repoBasePath || '',
  assetPrefix: repoBasePath,
}

module.exports = nextConfig
