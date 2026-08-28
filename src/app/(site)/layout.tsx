import { EdgeTitle } from "@/components/EdgeTitle";
import { ThemeToggle } from "@/components/ThemeToggle";

// （已修正）main 從「整頁鎖死在一個畫面、不能捲動」（h-full overflow-hidden）改成
// 「用整頁捲動在幾個滿版畫面之間切換」（overflow-y-auto + snap-y snap-mandatory）——
// 首頁現在是「策展宣言」（CuratorialManifesto，第一個 100dvh 畫面）＋「兩欄展覽」
// （SplitExhibition，第二個 100dvh 畫面）疊在一起，見 (site)/page.tsx。兩欄展覽本身
// 內部的自訂捲動物理（PhotoStream 的滾輪慣性）掛在它自己的欄位捲動容器上，跟這裡的
// 整頁捲動是兩層獨立的捲動範圍，不會互相干擾——進到某一欄裡面捲動時，該欄的滾輪事件
// 會呼叫 preventDefault()，不會漏出來影響這裡的整頁捲動。
// 左右內距維持在 main 這一層（不下放到個別區塊），這樣不管捲到「策展宣言」還是「兩欄
// 展覽」，內容都固定跟 EdgeTitle 左右兩側的直書標題保持一樣的留白，視覺上像同一個相框
// 貫穿全程；上內距只需要在最上面（策展宣言開頭）出現一次，兩個畫面之間不留額外空隙，
// 才會有「捲一整屏換下一屏」的感覺，不是「捲一段距離、中間卡一截空白」。
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[100dvh]">
      <EdgeTitle />
      <main className="h-full snap-y snap-mandatory overflow-y-auto pt-[18px] pr-[18px] pl-[18px] sm:pt-[30px] sm:pr-[30px] sm:pl-[30px]">
        {children}
      </main>
      <ThemeToggle />
    </div>
  );
}
