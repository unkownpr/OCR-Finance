import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace root uyarısını düzelt
  outputFileTracingRoot: __dirname,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // PWA için gerekli header'lar
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
  // Tesseract.js için webpack yapılandırması
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Tesseract.js worker dosyalarını kopyala
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
    }
    return config;
  },
};

export default nextConfig;
