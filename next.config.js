/** @type {import('next').NextConfig} */
const nextConfig = { 
  poweredByHeader: false, 
  compress: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
module.exports = nextConfig;
