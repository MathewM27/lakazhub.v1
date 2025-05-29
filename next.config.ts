import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lakazhub.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'qqqes0fuio.ufs.sh',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dtfjgotmshpzwixxpwhe.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  productionBrowserSourceMaps: true,
  
  // Disable ESLint during builds
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

const isAnalyze = process.env.ANALYZE === 'true';

const config = isAnalyze
  ? require('@next/bundle-analyzer')({ enabled: true })(nextConfig)
  : nextConfig;

export default config;