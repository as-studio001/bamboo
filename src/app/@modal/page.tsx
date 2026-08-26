// 用 <Link href="/"> 導回首頁時（例如點 EdgeTitle 的品牌連結），modal slot 在「/」這個
// 路由本身也要回傳 null，才會確實關閉——單靠 default.tsx 只處理「重新整理／直接訪問」
// 這種整頁載入的情況，不會處理透過 client-side 導覽回到「/」的情況。
export default function Page() {
  return null;
}
