/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'oaidalleapiprodscus.blob.core.windows.net',
      'images.unsplash.com',
      'plus.unsplash.com',
      'vygnaincvkmfhyqgwube.supabase.co',
      // Add any other domains you need for images
    ],
  },
  env: {
    // Hard-coded production URL
    NEXT_PUBLIC_SITE_URL: 'https://lakazhub.com',
    SITE_URL: 'https://lakazhub.com',
  },
  // Add assetPrefix if using a CDN
  // assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  
  // Enable trailing slashes if needed
  // trailingSlash: true,
  
  // Add production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
