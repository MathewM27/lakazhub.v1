import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dtfjgotmshpzwixxpwhe.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'qqqes0fuio.ufs.sh',
        pathname: '/**',
      },
    ],
  },
  productionBrowserSourceMaps: true,
};

const isAnalyze = process.env.ANALYZE === 'true';

const config = isAnalyze
  ? require('@next/bundle-analyzer')({ enabled: true })(nextConfig)
  : nextConfig;

export default config;