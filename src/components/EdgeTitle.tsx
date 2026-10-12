"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TITLE = "2026常民竹小屋";

// 標題整併進三周白色邊框裡，貼著左右兩側直書呈現，參考 Meili Vogt Conzett 的邊界直書標題處理。
// 用 fixed（不是 absolute）貼在視窗邊緣——首頁雙欄整頁固定 100dvh 不捲動，兩種定位視覺上沒差別；
// 但案例內頁是一般可捲動文件，absolute 會被撐得跟內容一樣高，要用 fixed 才會一路貼齊視窗邊緣。
//
// side 預設兩側都顯示（首頁用法）；案例內頁的左側邊框改放章節導覽（見 ProjectDetail.tsx 的
// ChapterEdgeNav），取代這裡的品牌文字，所以內頁只會傳 side="right"，保留右側的「2026林鐵構築」。
//
// 點擊要回到首頁最上面的「策展宣言」。首頁真正在捲的是 (site)/layout.tsx 的 <main>（不是視窗），
// 單靠 <Link href="/"> 在首頁上點不會捲回去，所以：
// - 畫面上有宣言頁（首頁本身、或首頁上開著案例彈出視窗）：自己把宣言頁捲進畫面；在首頁時
//   擋掉 Link 的導覽，彈出視窗時照常導覽回「/」把視窗關掉，同時捲回宣言
// - 案例獨立頁面（沒有宣言頁）：照常導覽回首頁，首頁重新掛載本來就從宣言開始
export function EdgeTitle({ side = "both" }: { side?: "left" | "right" | "both" }) {
  const pathname = usePathname();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const manifesto = document.getElementById("manifesto");
    if (!manifesto) return;
    if (pathname === "/") e.preventDefault();
    manifesto.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      {(side === "left" || side === "both") && (
        <Link
          href="/"
          onClick={handleClick}
          aria-label={TITLE}
          className="fixed inset-y-0 left-0 z-40 flex w-[18px] items-center justify-center sm:w-[30px]"
        >
          <span className="[writing-mode:vertical-rl] font-serif-tc text-[10px] tracking-[0.2em] text-[var(--foreground)] uppercase sm:text-xs">
            {TITLE}
          </span>
        </Link>
      )}
      {(side === "right" || side === "both") && (
        <Link
          href="/"
          onClick={handleClick}
          aria-label={TITLE}
          className="fixed inset-y-0 right-0 z-40 flex w-[18px] items-center justify-center sm:w-[30px]"
        >
          <span className="[writing-mode:vertical-rl] font-serif-tc text-[10px] tracking-[0.2em] text-[var(--foreground)] uppercase sm:text-xs">
            {TITLE}
          </span>
        </Link>
      )}
    </>
  );
}
