import { BackHomeButton } from "@/components/BackHomeButton";
import { EdgeTitle } from "@/components/EdgeTitle";
import { getProjectBySlug } from "@/lib/projects";

// 跟 (site)/layout.tsx 共用同一套三周白色留白＋EdgeTitle 的「外框」視覺，
// 但案例內頁是一般文件流從上捲到下的長頁面，所以不設 h-[100dvh] overflow-hidden——
// 那是首頁雙欄各自獨立捲動才需要的固定高度限制，內頁反而需要正常的整頁捲動。
//
// 左側邊框只留給 ProjectDetail.tsx 的 ChapterEdgeNav（章節導覽取代這裡的「2026林鐵構築」），
// 這裡的 EdgeTitle 只畫右側，避免兩者疊在同一個位置上。右側在品牌名後面接「 × 案名」（見 EdgeTitle.tsx）。
export default async function ProjectLayout({ children, params }: LayoutProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  return (
    <div className="relative min-h-[100dvh]">
      <EdgeTitle side="right" projectName={project?.name} />
      <BackHomeButton />
      <main className="min-h-[100dvh] pt-[18px] pr-[18px] pl-[18px] sm:pt-[30px] sm:pr-[30px] sm:pl-[30px]">
        {children}
      </main>
    </div>
  );
}
