import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Increase to 50MB to handle JAR file uploads
    },
  },
};

export default nextConfig;
