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
  title: "林鐵構竹展",
  description: "兩棟建築案的線上展覽",
};

// 先於畫面繪製前套用深色模式設定，避免先閃一下淺色再切換。
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();
`;

// modal 是 @modal 這個並行路由 slot（見 src/app/@modal/），案例內頁的彈出視窗
// （DetailModal）就是從這裡疊在 children 上面——兩者同時掛載，首頁不會因為開了 modal
// 就被卸載，這也是「首頁在 modal 後面看得到、章節標籤列共用」的機制基礎。
export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      suppressHydrationWarning
      className={`${notoSerifTC.variable} ${notoSansTC.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
        {modal}
      </body>
    </html>
  );
}
