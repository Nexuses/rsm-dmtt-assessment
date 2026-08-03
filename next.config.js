/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-nexlink.s3.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '22527425.fs1.hubspotusercontent-na2.net',
      },
      {
        protocol: 'https',
        hostname: 'nexuseslink2024.s3.us-east-2.amazonaws.com',
      },
    ],
  },
  reactStrictMode: true,
  transpilePackages: ["framer-motion"],
  serverExternalPackages: ['@react-pdf/renderer'],
  turbopack: {
    // Ensure this project directory is treated as the Turbo/Next root
    root: __dirname,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        canvas: 'canvas',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
