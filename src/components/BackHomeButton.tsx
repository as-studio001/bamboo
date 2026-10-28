import Link from "next/link";

// （2026-10-28）案例獨立頁面（/projects/[slug]）右上角的「回首頁」按鈕。從首頁點進來的彈出視窗
// 右上角已經有 ×（見 DetailModal.tsx），獨立頁面沒有，直接開網址或重新整理後就找不到路回首頁。
// 位置跟彈出視窗的 × 同一個角落；白底小圓角，壓在封面照片上或白色章節上都看得清楚。
export function BackHomeButton() {
  return (
    <Link
      href="/"
      className="fixed top-6 right-6 z-50 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 font-serif-tc text-xs font-bold tracking-wide text-[#3f3c38] shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-black sm:top-[46px] sm:right-[50px] sm:text-sm"
    >
      <span aria-hidden="true">←</span>
      回首頁
    </Link>
  );
}
