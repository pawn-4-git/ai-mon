import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // 静的エクスポートを有効にする
  images: {
    unoptimized: true,
  },

  // GitHub Pagesでプロジェクトサイトとして公開する場合のパス設定
  // 環境変数 NEXT_PUBLIC_BASE_PATH を使用して動的に決定
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ? `${process.env.NEXT_PUBLIC_BASE_PATH}/` : '',
};

export default nextConfig;
