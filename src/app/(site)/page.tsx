import { getPublishedProjects, homeCover, type Project } from "@/lib/projects";
import { SplitExhibition } from "@/components/SplitExhibition";
import { CuratorialManifesto, type BridgeProject } from "@/components/CuratorialManifesto";

// 策展宣言最後一屏「兩案預告」只需要案名、資訊跟手稿，不把整份案例資料傳進 client component
function toBridge(p: Project): BridgeProject {
  return {
    slug: p.slug,
    name: p.name,
    meta: [p.location, p.year, p.type].filter(Boolean).join(" · "),
    sketch: p.sketchImages?.find((img) => img.src)?.src,
    cover: homeCover(p)?.src,
  };
}
import { EventsSection } from "@/components/EventsSection";

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
      <CuratorialManifesto projects={[toBridge(a), toBridge(b)]} />
      <div id="exhibition" className="h-[100dvh] w-full shrink-0 snap-start">
        <SplitExhibition projects={[a, b]} />
      </div>
      {/* 第三個畫面：整個展覽共用的「活動」資訊，網頁最尾端，頂部選單「活動」捲到這裡 */}
      <EventsSection variant="screen" id="events-screen" />
    </>
  );
}
