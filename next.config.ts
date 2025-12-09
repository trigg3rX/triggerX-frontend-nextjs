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

  webpack: (config, { webpack: webpackInstance, isServer }) => {
    // Ignore React Native async storage package (not needed for web)
    config.plugins.push(
      new webpackInstance.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
      }),
    );

    // Exclude React Native packages using alias as fallback
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };

    // Provide fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Define indexedDB for SSR to prevent ReferenceError
    if (isServer) {
      // Use DefinePlugin to replace indexedDB references with undefined during SSR
      config.plugins.push(
        new webpackInstance.DefinePlugin({
          indexedDB: "undefined",
        }),
      );

      // Also inject a global assignment as a fallback
      config.plugins.push(
        new webpackInstance.BannerPlugin({
          banner:
            "if (typeof global !== 'undefined' && typeof global.indexedDB === 'undefined') { try { global.indexedDB = undefined; } catch(e) {} }",
          raw: true,
          entryOnly: true,
        }),
      );
    }

    return config;
  },
};

export default nextConfig;
