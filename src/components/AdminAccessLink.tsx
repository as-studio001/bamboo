// 首頁角落一顆低調的齒輪，是進到後台（/admin，見 public/admin.html）唯一的入口——展覽網站本身
// 不需要在導覽列上放「後台管理」這種明顯的連結，訪客不會用到，只有知道要找的人（會直接注意到
// 齒輪圖示的人）才會點進去，平常融在畫面角落、不搶視覺。
//
// 用原生 <a>（不是 next/link）——/admin 是 next.config.ts 的 rewrite 導去的靜態檔案
// （public/admin.html），不是 Next.js App Router 認得的頁面路由，走一般整頁導覽最單純，
// 不用擔心 next/link 的 prefetch／client-side routing 對一支不在 App Router 裡的靜態頁面
// 會有什麼行為落差。
//
// 只放在首頁（SplitExhibition.tsx 裡引用），不是全站 layout 的一部分——只有使用者要求「首頁
// 加入」，案例內頁沒有這個入口，維持原本乾淨的內頁導覽（ChapterEdgeNav／EdgeTitle）不受影響。
//
// 樣式比照 ThemeToggle.tsx 的固定圓形按鈕（同樣的 fixed／z-index／陰影邏輯），改放左下角
// （ThemeToggle 佔用右下角），預設半透明、hover 才轉全不透明——這是給知道要找的人用的入口，
// 不需要跟深色模式切換鈕一樣隨時明顯。
export function AdminAccessLink() {
  return (
    <a
      href="/admin"
      aria-label="後台管理"
      title="後台管理"
      className="fixed bottom-5 left-5 z-[110] flex h-9 w-9 items-center justify-center rounded-full opacity-40 shadow-md transition-opacity hover:opacity-100 sm:bottom-8 sm:left-8"
      style={{ backgroundColor: "var(--panel-text)", color: "var(--panel-bg)" }}
    >
      <GearIcon />
    </a>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
