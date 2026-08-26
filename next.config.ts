import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開發模式左下角那顆路由資訊指示器，跟網站本身的功能無關，關掉避免誤認成頁面按鈕。
  devIndicators: false,
};

export default nextConfig;
