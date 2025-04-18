import type { NextConfig } from "next";

// If you use bundle analyzer, keep this:
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  images: {
    domains: ['dtfjgotmshpzwixxpwhe.supabase.co'],
  },
  // Add any other Next.js config options here
};

// If using bundle analyzer, export like this:
export default withBundleAnalyzer(nextConfig);

// If NOT using bundle analyzer, use this instead:
// export default nextConfig;