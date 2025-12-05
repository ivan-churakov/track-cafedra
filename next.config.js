/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  swcMinify: true,
  basePath: `/track-cafedra`,
  assetPrefix: `/track-cafedra`,
};

module.exports = nextConfig;
