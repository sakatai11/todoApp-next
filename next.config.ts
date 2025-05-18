import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Ignore TypeScript errors during production builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
