import Link from "next/link";

const TITLE = "2026林鐵構築";

// 標題整併進三周白色邊框裡，貼著左右兩側直書呈現，參考 Meili Vogt Conzett 的邊界直書標題處理。
// 用 fixed（不是 absolute）貼在視窗邊緣——首頁雙欄整頁固定 100dvh 不捲動，兩種定位視覺上沒差別；
// 但案例內頁是一般可捲動文件，absolute 會被撐得跟內容一樣高，要用 fixed 才會一路貼齊視窗邊緣。
//
// side 預設兩側都顯示（首頁用法）；案例內頁的左側邊框改放章節導覽（見 ProjectDetail.tsx 的
// ChapterEdgeNav），取代這裡的品牌文字，所以內頁只會傳 side="right"，保留右側的「2026林鐵構築」。
export function EdgeTitle({ side = "both" }: { side?: "left" | "right" | "both" }) {
  return (
    <>
      {(side === "left" || side === "both") && (
        <Link
          href="/"
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
