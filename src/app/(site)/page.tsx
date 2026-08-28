import { getPublishedProjects } from "@/lib/projects";
import { SplitExhibition } from "@/components/SplitExhibition";
import { CuratorialManifesto } from "@/components/CuratorialManifesto";

// 首頁現在是兩個滿版畫面疊在一起、用整頁捲動切換（見 (site)/layout.tsx 的 main）：
// 先進「策展宣言」（CuratorialManifesto），向下捲動（或點宣言頁底部的捲動提示）才進到
// 現有的兩欄並列展覽（SplitExhibition）。id="exhibition" 是給宣言頁的捲動提示按鈕
// 當目標用（document.getElementById("exhibition")?.scrollIntoView()）。
export default function Home() {
  const items = getPublishedProjects();
  const [a, b] = items;

  if (!a || !b) return null;

  return (
    <>
      <CuratorialManifesto />
      <div id="exhibition" className="h-[100dvh] w-full shrink-0 snap-start">
        <SplitExhibition projects={[a, b]} />
      </div>
    </>
  );
}
