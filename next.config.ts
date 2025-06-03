import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Ignore TypeScript errors during production builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Webpack configuration to handle server-only modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'firebase-admin': false,
        'firebase-admin/app': false,
        'firebase-admin/auth': false,
        'firebase-admin/firestore': false,
      };
    }
    return config;
  },
};

export default nextConfig;
