import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@delego/ui", "@delego/sdk", "@delego/types"],
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.stellar.org" }],
  },
};

export default nextConfig;
