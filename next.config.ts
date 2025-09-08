import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Ignore TypeScript errors during production builds
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // XSS保護
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // クリックジャッキング防止
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // リファラーポリシー
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // ブラウザ機能制限
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
