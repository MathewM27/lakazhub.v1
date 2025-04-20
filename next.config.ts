import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'dtfjgotmshpzwixxpwhe.supabase.co',
      'qqqes0fuio.ufs.sh',
    ],
  },
  productionBrowserSourceMaps: true,
};

const isAnalyze = process.env.ANALYZE === 'true';

const config = isAnalyze
  ? require('@next/bundle-analyzer')({ enabled: true })(nextConfig)
  : nextConfig;

export default config;