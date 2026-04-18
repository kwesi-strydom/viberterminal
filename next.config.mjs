/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  experimental: {
    // Allow large uploads for (future) bundle hosting. Safe to leave default now.
  },
};

export default nextConfig;
