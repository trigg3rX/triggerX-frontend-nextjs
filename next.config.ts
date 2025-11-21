import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "img.logo.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
