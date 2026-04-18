/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages and ESM-only modules
  transpilePackages: ["framer-motion", "@mathdle/core"],

  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
