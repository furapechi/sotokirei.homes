import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 安定性優先: キャッシュ起因のビルド欠損を避ける
  webpack: (config) => {
    config.cache = false;
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
