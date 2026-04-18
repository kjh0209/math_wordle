/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow framer-motion and other packages that use ESM
  transpilePackages: ["framer-motion"],

  // Disable x-powered-by header
  poweredByHeader: false,

  // Strict mode for catching React issues early
  reactStrictMode: true,

  // Image optimization domains (add as needed)
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
