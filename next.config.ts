import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開發模式左下角那顆路由資訊指示器，跟網站本身的功能無關，關掉避免誤認成頁面按鈕。
  devIndicators: false,

  // /admin 改成直接吃 public/admin.html——這是一支純 HTML/JS 的獨立單頁 app（比照
  // Internal-Pages 的 admin/index.html 同一套架構：Supabase Auth 登入、案例列表／編輯器、
  // 存檔時呼叫共用的 Netlify Function github-proxy 直接寫回 content/projects/<slug>.json），
  // 不是 Next.js 的 React 頁面，所以不用 App Router 的 page.tsx，改用 rewrite 讓 Next.js
  // 把 /admin 這個路徑當靜態檔案直接回傳，網址看起來還是 /admin，不會變成 /admin.html。
  async rewrites() {
    return [{ source: "/admin", destination: "/admin.html" }];
  },
};

export default nextConfig;
