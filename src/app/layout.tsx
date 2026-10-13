import type { Metadata } from "next";
import { Noto_Serif_TC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-serif-tc",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-sans-tc",
  weight: ["300", "400", "500", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "常民竹小屋",
  description: "兩棟建築案的線上展覽",
};

// modal 是 @modal 這個並行路由 slot（見 src/app/@modal/），案例內頁的彈出視窗
// （DetailModal）就是從這裡疊在 children 上面——兩者同時掛載，首頁不會因為開了 modal
// 就被卸載，這也是「首頁在 modal 後面看得到、章節標籤列共用」的機制基礎。
//
// （2026-10-13）深色模式已取消，全站固定淺色——原本這裡有一段在畫面繪製前讀 localStorage／
// 系統偏好、設定 <html data-theme> 的程式，連同右下角的切換按鈕（ThemeToggle）一起拿掉。
// 以前切過深色的訪客瀏覽器裡還留著 localStorage 的 "theme"，但已經沒有程式會讀它，不影響顯示。
export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className={`${notoSerifTC.variable} ${notoSansTC.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
        {modal}
      </body>
    </html>
  );
}
